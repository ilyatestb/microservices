import { Transform } from 'class-transformer'
import { IsInt, IsOptional, Max, Min } from 'class-validator'

const DEFAULT_LIMIT = 25
const DEFAULT_PAGE = 1
const MAX_LIMIT = 100

const toNumber = ({ value }: { value: unknown }, fallback: number) => {
  const parsed = Number(value)
  return Number.isNaN(parsed) ? fallback : parsed
}

/**
 * Standard pagination payload supporting validation and transformation.
 */
export class PaginationQueryDto {
  @Transform((params) => toNumber(params, DEFAULT_PAGE))
  @IsInt()
  @Min(1)
  @IsOptional()
  page: number = DEFAULT_PAGE

  @Transform((params) => toNumber(params, DEFAULT_LIMIT))
  @IsInt()
  @Min(1)
  @Max(MAX_LIMIT)
  @IsOptional()
  limit: number = DEFAULT_LIMIT
}
