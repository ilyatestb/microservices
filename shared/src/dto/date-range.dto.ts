import { IsDateString, IsOptional } from 'class-validator'

/**
 * DTO describing optional ISO date boundaries.
 */
export class DateRangeDto {
  @IsDateString()
  @IsOptional()
  from?: string

  @IsDateString()
  @IsOptional()
  to?: string
}
