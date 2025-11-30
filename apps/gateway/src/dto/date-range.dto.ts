import { ApiPropertyOptional } from '@nestjs/swagger'
import { DateRangeDto } from '@my-apps/shared'

/**
 * Extended DTO for date range with Swagger documentation.
 */
export class DateRangeSwaggerDto extends DateRangeDto {
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
}
