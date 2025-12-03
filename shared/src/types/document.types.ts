/**
 * Document structure in MongoDB 'data' collection.
 */
export type DataDocument = Record<string, unknown>

/**
 * Log entry structure in MongoDB 'logs' collection.
 */
export interface LogEntry {
  _id?: unknown
  type: string
  payload: Record<string, unknown>
  timestamp: Date
  service: string
}
