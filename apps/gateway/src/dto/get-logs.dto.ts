import { ApiPropertyOptional } from '@nestjs/swagger'
import { GetLogsDto, EventType } from '@my-apps/shared'

/**
 * Extended DTO for getting logs with Swagger documentation.
 */
export class GetLogsSwaggerDto extends GetLogsDto {
  @ApiPropertyOptional({
    description: 'Filter logs by event type',
    example: EventType.DATA_FETCH_COMPLETED,
    enum: EventType,
    enumName: 'EventType',
    type: String,
  })
  declare type?: string

  @ApiPropertyOptional({
    description: 'Start date in ISO format',
    example: '2025-01-01T00:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  declare from?: string

  @ApiPropertyOptional({
    description: 'End date in ISO format',
    example: '2025-12-31T23:59:59.999Z',
    type: String,
    format: 'date-time',
  })
  declare to?: string

  @ApiPropertyOptional({
    description: 'Page number (starts from 1)',
    example: 1,
    type: Number,
    minimum: 1,
    default: 1,
  })
  declare page: number

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 25,
    type: Number,
    minimum: 1,
    maximum: 100,
    default: 25,
  })
  declare limit: number
}
