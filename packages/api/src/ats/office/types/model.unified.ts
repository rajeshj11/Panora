import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsString, IsDateString } from 'class-validator';

export class UnifiedAtsOfficeInput {
  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'The name of the office',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'The location of the office',
  })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({
    type: Object,
    additionalProperties: true,
    nullable: true,
    description:
      'The custom field mappings of the object between the remote 3rd party & Panora',
  })
  @IsOptional()
  field_mappings?: Record<string, any>;
}

export class UnifiedAtsOfficeOutput extends UnifiedAtsOfficeInput {
  @ApiPropertyOptional({ type: String, description: 'The UUID of the office' })
  @IsUUID()
  @IsOptional()
  id?: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'The remote ID of the office in the context of the 3rd Party',
  })
  @IsString()
  @IsOptional()
  remote_id?: string;

  @ApiPropertyOptional({
    type: Object,
    nullable: true,
    additionalProperties: true,
    description:
      'The remote data of the office in the context of the 3rd Party',
  })
  @IsOptional()
  remote_data?: Record<string, any>;

  @ApiPropertyOptional({
    type: Date,
    nullable: true,
    description: 'The created date of the object',
  })
  @IsOptional()
  created_at?: Date;

  @ApiPropertyOptional({
    type: Date,
    nullable: true,
    description: 'The modified date of the object',
  })
  @IsOptional()
  modified_at?: Date;
}
