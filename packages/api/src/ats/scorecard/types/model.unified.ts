import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsOptional,
  IsString,
  IsDateString,
  IsIn,
} from 'class-validator';
export type ScoreCardRecommendation =
  | 'DEFINITELY_NO'
  | 'NO'
  | 'YES'
  | 'STRONG_YES'
  | 'NO_DECISION';

export class UnifiedAtsScorecardInput {
  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'The overall recommendation',
  })
  @IsIn(['DEFINITELY_NO', 'NO', 'YES', 'STRONG_YES', 'NO_DECISION'])
  @IsOptional()
  overall_recommendation?: ScoreCardRecommendation | string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'The UUID of the application',
  })
  @IsUUID()
  @IsOptional()
  application_id?: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'The UUID of the interview',
  })
  @IsUUID()
  @IsOptional()
  interview_id?: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'The remote creation date of the scorecard',
  })
  @IsDateString()
  @IsOptional()
  remote_created_at?: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'The submission date of the scorecard',
  })
  @IsDateString()
  @IsOptional()
  submitted_at?: string;

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

export class UnifiedAtsScorecardOutput extends UnifiedAtsScorecardInput {
  @ApiPropertyOptional({
    type: String,
    description: 'The UUID of the scorecard',
  })
  @IsUUID()
  @IsOptional()
  id?: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description:
      'The remote ID of the scorecard in the context of the 3rd Party',
  })
  @IsString()
  @IsOptional()
  remote_id?: string;

  @ApiPropertyOptional({
    type: Object,
    nullable: true,
    additionalProperties: true,
    description:
      'The remote data of the scorecard in the context of the 3rd Party',
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
