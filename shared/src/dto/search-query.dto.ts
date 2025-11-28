import { IsOptional, IsString } from 'class-validator'
import { PaginationQueryDto } from './pagination-query.dto'

/**
 * DTO for search queries with pagination support.
 * Extends PaginationQueryDto to include search query parameter.
 */
export class SearchQueryDto extends PaginationQueryDto {
  @IsString()
  @IsOptional()
  query?: string
}
