import { IsOptional, IsString } from 'class-validator'
import { PaginationQueryDto } from './pagination-query.dto'

/**
 * DTO for getting logs with filters.
 * Extends PaginationQueryDto to include type and date range filters.
 */
export class GetLogsDto extends PaginationQueryDto {
  @IsString()
  @IsOptional()
  type?: string

  @IsString()
  @IsOptional()
  from?: string

  @IsString()
  @IsOptional()
  to?: string
}
