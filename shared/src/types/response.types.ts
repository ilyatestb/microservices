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
  total: number
  page: number
  limit: number
}

import { LogEntry } from './document.types'

/**
 * Response for get logs operation.
 */
export interface GetLogsResponse {
  logs: LogEntry[]
  total: number
  page: number
  limit: number
}

/**
 * Response for generate report operation.
 */
export interface GenerateReportResponse {
  pdf: string
}
