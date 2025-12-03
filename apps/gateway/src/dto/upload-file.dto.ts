import { ApiProperty } from '@nestjs/swagger'
import { UploadFileDto } from '@my-apps/shared'

/**
 * Extended DTO for uploading file with Swagger documentation.
 */

export class UploadFileSwaggerDto extends UploadFileDto {
  @ApiProperty({
    description: 'JSON file to upload and parse',
    type: String,
    format: 'binary',
    example: 'file.json',
  })
  declare file: Express.Multer.File
}
