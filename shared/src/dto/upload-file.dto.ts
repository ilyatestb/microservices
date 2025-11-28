import { IsString } from 'class-validator'

/**
 * DTO for uploading and parsing a file.
 */
export class UploadFileDto {
  @IsString()
  filePath!: string
}
