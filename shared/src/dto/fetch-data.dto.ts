import { IsString, IsUrl } from 'class-validator'

/**
 * DTO for fetching data from external API.
 */
export class FetchDataDto {
  @IsUrl()
  @IsString()
  apiUrl!: string
}
