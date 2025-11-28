import { ApiProperty } from '@nestjs/swagger'
import { UploadFileDto } from '@my-apps/shared'

/**
 * Extended DTO for uploading file with Swagger documentation.
 */
export class UploadFileSwaggerDto extends UploadFileDto {
  @ApiProperty({
    description: 'Path to the JSON file to upload and parse',
    example: './data/data_1234567890.json',
    type: String,
  })
  declare filePath: string
}
