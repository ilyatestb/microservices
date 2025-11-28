/**
 * Message routing patterns for microservices communication via Redis.
 */
export enum MessageType {
  DATA_FETCH = 'data.fetch',
  DATA_UPLOAD = 'data.upload',
  DATA_SEARCH = 'data.search',
  LOGS_GET = 'logs.get',
  LOGS_REPORT = 'logs.report',
  JOURNAL_QUEUE = 'journal_queue',
}

/**
 * Event routing patterns for event-driven communication via Redis.
 */
export enum MicroserviceEventPattern {
  DATA_PIPELINE_QUEUE = 'data_pipeline_queue',
}

/**
 * Redis pub/sub channels for event broadcasting.
 */
export enum PubSubChannel {
  EVENTS = 'events',
}
