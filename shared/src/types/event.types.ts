/**
 * Event types used across microservices.
 */
export enum EventType {
  DATA_FETCH_STARTED = 'data.fetch.started',
  DATA_FETCH_COMPLETED = 'data.fetch.completed',
  DATA_FETCH_FAILED = 'data.fetch.failed',
  DATA_UPLOAD_STARTED = 'data.upload.started',
  DATA_UPLOAD_COMPLETED = 'data.upload.completed',
  DATA_UPLOAD_FAILED = 'data.upload.failed',
  DATA_SEARCH_STARTED = 'data.search.started',
  DATA_SEARCH_COMPLETED = 'data.search.completed',
  DATA_SEARCH_FAILED = 'data.search.failed',
}

/**
 * Base structure for event payloads.
 */
export interface BaseEventPayload {
  [key: string]: unknown
}

/**
 * Payload for data.fetch events.
 */
export interface DataFetchEventPayload extends BaseEventPayload {
  apiUrl: string
  filePath?: string
  recordCount?: number
  error?: string
}

/**
 * Payload for data.upload events.
 */
export interface DataUploadEventPayload extends BaseEventPayload {
  filename: string
  insertedCount?: number
  error?: string
}

/**
 * Payload for data.search events.
 */
export interface DataSearchEventPayload extends BaseEventPayload {
  query: string
  page?: number
  limit?: number
  total?: number
  found?: number
  error?: string
}

/**
 * Union type for all event payloads.
 */
export type EventPayload = DataFetchEventPayload | DataUploadEventPayload | DataSearchEventPayload

/**
 * Complete event structure published to Redis.
 */
export interface Event {
  type: EventType | string
  payload: EventPayload
  timestamp: number
  service: string
}
