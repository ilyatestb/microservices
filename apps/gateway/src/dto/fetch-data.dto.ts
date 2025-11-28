import { ApiProperty } from '@nestjs/swagger'
import { FetchDataDto } from '@my-apps/shared'

/**
 * Extended DTO for fetching data with Swagger documentation.
 */
export class FetchDataSwaggerDto extends FetchDataDto {
  @ApiProperty({
    description: 'URL of the external API to fetch data from',
    example: 'https://jsonplaceholder.typicode.com/posts',
    type: String,
  })
  declare apiUrl: string
}
