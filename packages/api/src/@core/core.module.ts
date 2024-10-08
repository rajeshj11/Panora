import { Module } from '@nestjs/common';
import { EnvironmentModule } from './@core-services/environment/environment.module';
import { BullQueueModule } from './@core-services/queues/queue.module';
import { IngestDataService } from './@core-services/unification/ingest-data.service';
import { WebhookModule } from './@core-services/webhooks/panora-webhooks/webhook.module';
import { ManagedWebhooksModule } from './@core-services/webhooks/third-parties-webhooks/managed-webhooks.module';
import { AuthModule } from './auth/auth.module';
import { ConnectionsStrategiesModule } from './connections-strategies/connections-strategies.module';
import { ConnectionsModule } from './connections/connections.module';
import { EventsModule } from './events/events.module';
import { FieldMappingModule } from './field-mapping/field-mapping.module';
import { LinkedUsersModule } from './linked-users/linked-users.module';
import { MagicLinkModule } from './magic-link/magic-link.module';
import { OrganisationsModule } from './organisations/organisations.module';
import { PassthroughModule } from './passthrough/passthrough.module';
import { ProjectConnectorsModule } from './project-connectors/project-connectors.module';
import { ProjectsModule } from './projects/projects.module';
import { SyncModule } from './sync/sync.module';
import { RagModule } from './rag/rag.module';

@Module({
  imports: [
    AuthModule,
    ConnectionsModule,
    LinkedUsersModule,
    OrganisationsModule,
    ProjectsModule,
    FieldMappingModule,
    EventsModule,
    MagicLinkModule,
    PassthroughModule,
    WebhookModule,
    ManagedWebhooksModule,
    EnvironmentModule,
    ConnectionsStrategiesModule,
    SyncModule,
    ProjectConnectorsModule,
    BullQueueModule,
    RagModule,
  ],
  exports: [
    AuthModule,
    ConnectionsModule,
    LinkedUsersModule,
    OrganisationsModule,
    ProjectsModule,
    FieldMappingModule,
    EventsModule,
    MagicLinkModule,
    PassthroughModule,
    WebhookModule,
    ManagedWebhooksModule,
    EnvironmentModule,
    ConnectionsStrategiesModule,
    SyncModule,
    ProjectConnectorsModule,
    IngestDataService,
    BullQueueModule,
    RagModule,
  ],
  providers: [IngestDataService],
})
export class CoreModule {}
