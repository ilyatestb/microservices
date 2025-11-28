import { ApiPropertyOptional } from '@nestjs/swagger'
import { SearchQueryDto } from '@my-apps/shared'

/**
 * Extended DTO for search queries with Swagger documentation.
 */
export class SearchQuerySwaggerDto extends SearchQueryDto {
  @ApiPropertyOptional({
    description: 'Search query string',
    type: String,
  })
  declare query?: string

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
