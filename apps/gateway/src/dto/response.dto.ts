import { ApiProperty } from '@nestjs/swagger'
import { FetchDataResponse, UploadFileResponse, SearchDataResponse, GetLogsResponse } from '@my-apps/shared'

/**
 * Response DTO for fetch data operation.
 */
export class FetchDataResponseDto implements FetchDataResponse {
  @ApiProperty({
    description: 'Path to the saved JSON file',
    example: './data/data_1234567890.json',
    type: String,
  })
  filePath!: string

  @ApiProperty({
    description: 'Number of records fetched',
    example: 100,
    type: Number,
  })
  recordCount!: number
}

/**
 * Response DTO for upload file operation.
 */
export class UploadFileResponseDto implements UploadFileResponse {
  @ApiProperty({
    description: 'Number of documents inserted into MongoDB',
    example: 100,
    type: Number,
  })
  insertedCount!: number
}

/**
 * Response DTO for search data operation.
 */
export class SearchDataResponseDto implements SearchDataResponse {
  @ApiProperty({
    description: 'Array of matching documents',
    type: [Object],
    example: [{ id: 1, title: 'Example', body: 'Content' }],
  })
  data!: Record<string, unknown>[]

  @ApiProperty({
    description: 'Total number of matching documents',
    example: 100,
    type: Number,
  })
  total!: number

  @ApiProperty({
    description: 'Current page number',
    example: 1,
    type: Number,
  })
  page!: number

  @ApiProperty({
    description: 'Number of items per page',
    example: 25,
    type: Number,
  })
  limit!: number
}

/**
 * Log entry DTO for Swagger documentation.
 */
export class LogEntryDto {
  @ApiProperty({ description: 'Log entry ID', type: String })
  _id!: unknown

  @ApiProperty({ description: 'Event type', example: 'data.fetch.completed', type: String })
  type!: string

  @ApiProperty({ description: 'Event payload', type: Object })
  payload!: Record<string, unknown>

  @ApiProperty({ description: 'Event timestamp', type: Date })
  timestamp!: Date

  @ApiProperty({ description: 'Service name', example: 'data-pipeline', type: String })
  service!: string

  @ApiProperty({ description: 'Creation timestamp', type: Date })
  createdAt!: Date
}

/**
 * Response DTO for get logs operation.
 */
export class GetLogsResponseDto implements GetLogsResponse {
  @ApiProperty({
    description: 'Array of log entries',
    type: [LogEntryDto],
    isArray: true,
  })
  logs!: LogEntryDto[]

  @ApiProperty({
    description: 'Total number of matching logs',
    example: 100,
    type: Number,
  })
  total!: number

  @ApiProperty({
    description: 'Current page number',
    example: 1,
    type: Number,
  })
  page!: number

  @ApiProperty({
    description: 'Number of items per page',
    example: 25,
    type: Number,
  })
  limit!: number
}
