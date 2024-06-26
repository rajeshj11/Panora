import { Injectable, OnModuleInit } from '@nestjs/common';
import { LoggerService } from '@@core/@core-services/logger/logger.service';
import { PrismaService } from '@@core/@core-services/prisma/prisma.service';
import { SyncError, throwTypedError } from '@@core/utils/errors';
import { Cron } from '@nestjs/schedule';
import { ApiResponse } from '@@core/utils/types';
import { v4 as uuidv4 } from 'uuid';
import { FieldMappingService } from '@@core/field-mapping/field-mapping.service';
import { ServiceRegistry } from '../services/registry.service';
import { TicketingObject } from '@ticketing/@lib/@types';
import { WebhookService } from '@@core/@core-services/webhooks/panora-webhooks/webhook.service';
import { UnifiedTagOutput } from '../types/model.unified';
import { ITagService } from '../types';
import { OriginalTagOutput } from '@@core/utils/types/original/original.ticketing';
import { tcg_tags as TicketingTag } from '@prisma/client';
import { TICKETING_PROVIDERS } from '@panora/shared';
import { CoreSyncRegistry } from '@@core/@core-services/registries/core-sync.registry';
import { BullQueueService } from '@@core/@core-services/queues/shared.service';
import { IBaseSync } from '@@core/utils/types/interface';
import { IngestDataService } from '@@core/@core-services/unification/ingest-data.service';
import { CoreUnification } from '@@core/@core-services/unification/core-unification.service';

@Injectable()
export class SyncService implements OnModuleInit, IBaseSync {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
    private webhook: WebhookService,
    private fieldMappingService: FieldMappingService,
    private serviceRegistry: ServiceRegistry,
    private coreUnification: CoreUnification,
    private registry: CoreSyncRegistry,
    private bullQueueService: BullQueueService,
    private ingestService: IngestDataService,
  ) {
    this.logger.setContext(SyncService.name);
    this.registry.registerService('ticketing', 'tag', this);
  }

  async onModuleInit() {
    try {
      await this.bullQueueService.queueSyncJob(
        'ticketing-sync-tags',
        '0 0 * * *',
      );
    } catch (error) {
      throw error;
    }
  }

  //function used by sync worker which populate our tcg_tags table
  //its role is to fetch all tags from providers 3rd parties and save the info inside our db
  //@Cron('*/2 * * * *') // every 2 minutes (for testing)
  @Cron('0 */8 * * *') // every 8 hours
  async syncTags(user_id?: string) {
    try {
      this.logger.log(`Syncing tags....`);
      const users = user_id
        ? [
            await this.prisma.users.findUnique({
              where: {
                id_user: user_id,
              },
            }),
          ]
        : await this.prisma.users.findMany();
      if (users && users.length > 0) {
        for (const user of users) {
          const projects = await this.prisma.projects.findMany({
            where: {
              id_user: user.id_user,
            },
          });
          for (const project of projects) {
            const id_project = project.id_project;
            const linkedUsers = await this.prisma.linked_users.findMany({
              where: {
                id_project: id_project,
              },
            });
            linkedUsers.map(async (linkedUser) => {
              try {
                const providers = TICKETING_PROVIDERS;
                for (const provider of providers) {
                  try {
                    const connection = await this.prisma.connections.findFirst({
                      where: {
                        id_linked_user: linkedUser.id_linked_user,
                        provider_slug: provider.toLowerCase(),
                      },
                    });
                    //call the sync comments for every ticket of the linkedUser (a comment is tied to a ticket)
                    const tickets = await this.prisma.tcg_tickets.findMany({
                      where: {
                        id_connection: connection.id_connection,
                      },
                    });
                    for (const ticket of tickets) {
                      await this.syncTagsForLinkedUser(
                        provider,
                        linkedUser.id_linked_user,
                        ticket.id_tcg_ticket,
                      );
                    }
                  } catch (error) {
                    throw error;
                  }
                }
              } catch (error) {
                throw error;
              }
            });
          }
        }
      }
    } catch (error) {
      throw error;
    }
  }

  //todo: HANDLE DATA REMOVED FROM PROVIDER
  async syncTagsForLinkedUser(
    integrationId: string,
    linkedUserId: string,
    id_ticket: string,
  ) {
    try {
      this.logger.log(
        `Syncing ${integrationId} tags for linkedTag ${linkedUserId}`,
      );
      // check if linkedTag has a connection if not just stop sync
      const connection = await this.prisma.connections.findFirst({
        where: {
          id_linked_user: linkedUserId,
          provider_slug: integrationId,
          vertical: 'ticketing',
        },
      });
      if (!connection) {
        this.logger.warn(
          `Skipping tags syncing... No ${integrationId} connection was found for linked user ${linkedUserId} `,
        );
      }
      // get potential fieldMappings and extract the original properties name
      const customFieldMappings =
        await this.fieldMappingService.getCustomFieldMappings(
          integrationId,
          linkedUserId,
          'ticketing.tag',
        );

      const service: ITagService =
        this.serviceRegistry.getService(integrationId);
      if (!service) return;
      const resp: ApiResponse<OriginalTagOutput[]> = await service.syncTags(
        linkedUserId,
        id_ticket,
      );

      const sourceObject: OriginalTagOutput[] = resp.data;

      await this.ingestService.ingestData<UnifiedTagOutput, OriginalTagOutput>(
        sourceObject,
        integrationId,
        connection.id_connection,
        'ticketing',
        'tag',
        customFieldMappings,
        { id_ticket: id_ticket },
      );
      //TODO; do it in every file
      if (!sourceObject || sourceObject.length == 0) {
        this.logger.warn('Source object is empty, returning :) ....');
        return;
      }
    } catch (error) {
      throw error;
    }
  }

  async saveToDb(
    connection_id: string,
    linkedUserId: string,
    tags: UnifiedTagOutput[],
    originSource: string,
    remote_data: Record<string, any>[],
    id_ticket: string,
  ): Promise<TicketingTag[]> {
    try {
      let tags_results: TicketingTag[] = [];
      for (let i = 0; i < tags.length; i++) {
        const tag = tags[i];
        const originId = tag.remote_id;

        if (!originId || originId == '') {
          return;
        }

        const existingTag = await this.prisma.tcg_tags.findFirst({
          where: {
            remote_id: originId,
            id_connection: connection_id,
          },
        });

        let unique_ticketing_tag_id: string;

        if (existingTag) {
          // Update the existing ticket
          const res = await this.prisma.tcg_tags.update({
            where: {
              id_tcg_tag: existingTag.id_tcg_tag,
            },
            data: {
              name: existingTag.name,
              modified_at: new Date(),
            },
          });
          unique_ticketing_tag_id = res.id_tcg_tag;
          tags_results = [...tags_results, res];
        } else {
          // Create a new tag
          this.logger.log('not existing tag ' + tag.name);

          const data = {
            id_tcg_tag: uuidv4(),
            name: tag.name,
            created_at: new Date(),
            modified_at: new Date(),
            id_tcg_ticket: id_ticket,
            remote_id: originId,
            id_connection: connection_id,
          };
          const res = await this.prisma.tcg_tags.create({
            data: data,
          });
          tags_results = [...tags_results, res];
          unique_ticketing_tag_id = res.id_tcg_tag;
        }

        // check duplicate or existing values
        if (tag.field_mappings && tag.field_mappings.length > 0) {
          const entity = await this.prisma.entity.create({
            data: {
              id_entity: uuidv4(),
              ressource_owner_id: unique_ticketing_tag_id,
            },
          });

          for (const [slug, value] of Object.entries(tag.field_mappings)) {
            const attribute = await this.prisma.attribute.findFirst({
              where: {
                slug: slug,
                source: originSource,
                id_consumer: linkedUserId,
              },
            });

            if (attribute) {
              await this.prisma.value.create({
                data: {
                  id_value: uuidv4(),
                  data: value || 'null',
                  attribute: {
                    connect: {
                      id_attribute: attribute.id_attribute,
                    },
                  },
                  entity: {
                    connect: {
                      id_entity: entity.id_entity,
                    },
                  },
                },
              });
            }
          }
        }

        //insert remote_data in db
        await this.prisma.remote_data.upsert({
          where: {
            ressource_owner_id: unique_ticketing_tag_id,
          },
          create: {
            id_remote_data: uuidv4(),
            ressource_owner_id: unique_ticketing_tag_id,
            format: 'json',
            data: JSON.stringify(remote_data[i]),
            created_at: new Date(),
          },
          update: {
            data: JSON.stringify(remote_data[i]),
            created_at: new Date(),
          },
        });
      }
      return tags_results;
    } catch (error) {
      throw error;
    }
  }
}
