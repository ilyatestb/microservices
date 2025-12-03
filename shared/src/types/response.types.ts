import { LogEntry } from './document.types'
import { PaginationMeta } from './pagination.types'

/**
 * Response for fetch data operation.
 */
export interface FetchDataResponse {
  filePath: string
  recordCount: number
}

/**
 * Response for upload file operation.
 */
export interface UploadFileResponse {
  insertedCount: number
}

/**
 * Response for search data operation.
 */
export interface SearchDataResponse {
  data: Record<string, unknown>[]
  meta: PaginationMeta
}

/**
 * Response for get logs operation.
 */
export interface GetLogsResponse {
  data: LogEntry[]
  meta: PaginationMeta
}

/**
 * Response for generate report operation.
 */
export interface GenerateReportResponse {
  pdf: string
}
