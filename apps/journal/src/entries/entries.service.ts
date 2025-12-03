import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common'
import { Db } from 'mongodb'
import {
  MONGODB_DB,
  Event,
  LogEntry,
  GetLogsDto,
  GetLogsResponse,
  preparePagination,
  formatPaginatedResponse,
  buildLogsQuery,
  PubSubChannel,
} from '@my-apps/shared'
import { PdfGeneratorUtil } from '../utils/pdf-generator.util'
import { RedisSubscriberService } from './redis-subscriber.service'

@Injectable()
export class EntriesService implements OnModuleInit {
  private readonly logger = new Logger(EntriesService.name)

  constructor(
    @Inject(MONGODB_DB) private readonly db: Db,
    private readonly redisSubscriber: RedisSubscriberService,
  ) {}

  async onModuleInit() {
    this.logger.log('Initializing Redis pub/sub subscription')
    await this.redisSubscriber.subscribe(PubSubChannel.EVENTS, (event) => this.storeLog(event))
  }

  private async storeLog(event: Event): Promise<void> {
    try {
      const collection = this.db.collection<LogEntry>('logs')
      const logEntry: Omit<LogEntry, '_id'> = {
        type: event.type,
        payload: event.payload as Record<string, unknown>,
        timestamp: new Date(event.timestamp),
        service: event.service,
      }

      await collection.insertOne(logEntry)
      this.logger.log(`Stored log: ${event.type}`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.logger.error(`Failed to store log: ${errorMessage}`)
    }
  }

  async getLogs(filters: GetLogsDto): Promise<GetLogsResponse> {
    const collection = this.db.collection<LogEntry>('logs')

    const query = buildLogsQuery(filters)

    const { params, query: paginationQuery } = preparePagination(filters.page, filters.limit)
    const total = await collection.countDocuments(query)
    const logs = await collection
      .find(query)
      .sort({ timestamp: -1 })
      .skip(paginationQuery.skip)
      .limit(paginationQuery.limit)
      .toArray()

    return formatPaginatedResponse(logs, total, params)
  }

  async generatePdfReport(from?: string, to?: string): Promise<Buffer> {
    const collection = this.db.collection<LogEntry>('logs')

    const query = buildLogsQuery({ from, to })

    const logs = await collection.find(query).sort({ timestamp: 1 }).toArray()

    return PdfGeneratorUtil.generateLogsReportPdf(logs, { from, to })
  }
}
