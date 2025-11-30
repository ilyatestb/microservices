import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common'
import { Db } from 'mongodb'
import Redis from 'ioredis'
import { MONGODB_DB } from '@my-apps/shared'
import { REDIS_CLIENT } from '@my-apps/shared'
import { Event, LogEntry, GetLogsDto, GetLogsResponse, PubSubChannel } from '@my-apps/shared'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument = require('pdfkit')

@Injectable()
export class EntriesService implements OnModuleInit {
  private readonly logger = new Logger(EntriesService.name)

  constructor(
    @Inject(MONGODB_DB) private readonly db: Db,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async onModuleInit() {
    this.logger.log('Initializing Redis pub/sub subscription')
    await this.setupEventSubscription()
  }

  private async setupEventSubscription(): Promise<void> {
    try {
      this.logger.log(`Setting up Redis subscriber for channel: ${PubSubChannel.EVENTS}`)

      const subscriber = this.redis.duplicate()

      subscriber.on('connect', () => {
        this.logger.log('Redis subscriber connected')
      })

      subscriber.on('ready', async () => {
        this.logger.log(`Redis subscriber ready, subscribing to channel: ${PubSubChannel.EVENTS}`)
        try {
          const count = await subscriber.subscribe(PubSubChannel.EVENTS)
          this.logger.log(`Successfully subscribed to channel: ${PubSubChannel.EVENTS}, active subscriptions: ${count}`)
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          this.logger.error(`Failed to subscribe to channel: ${errorMessage}`)
        }
      })

      subscriber.on('message', async (channel, message) => {
        this.logger.log(`Received message on channel: ${channel}, message length: ${message.length}`)
        try {
          const event = JSON.parse(message) as Event
          this.logger.log(`Processing event: ${event.type} from service: ${event.service}`)
          await this.storeLog(event)
          this.logger.log(`Successfully stored event: ${event.type}`)
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          this.logger.error(`Failed to process event: ${errorMessage}`)
        }
      })

      subscriber.on('error', (error) => {
        const errorMessage = error instanceof Error ? error.message : String(error)
        this.logger.error(`Redis subscriber error: ${errorMessage}`)
      })

      subscriber.on('reconnecting', () => {
        this.logger.warn('Redis subscriber reconnecting...')
      })

      subscriber.on('close', () => {
        this.logger.warn('Redis subscriber connection closed')
      })

      // Check if already connected and subscribe immediately
      if (subscriber.status === 'ready') {
        this.logger.log('Redis subscriber already ready, subscribing immediately')
        try {
          const count = await subscriber.subscribe(PubSubChannel.EVENTS)
          this.logger.log(`Immediately subscribed to channel: ${PubSubChannel.EVENTS}, active subscriptions: ${count}`)
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          this.logger.error(`Failed to subscribe immediately: ${errorMessage}`)
        }
      } else {
        this.logger.log(`Redis subscriber status: ${subscriber.status}, waiting for ready event`)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.logger.error(`Failed to setup event subscription: ${errorMessage}`)
    }
  }

  private async storeLog(event: Event): Promise<void> {
    try {
      await this.ensureConnection()
      const collection = this.db.collection<LogEntry>('logs')
      const logEntry: Omit<LogEntry, '_id'> = {
        type: event.type,
        payload: event.payload as Record<string, unknown>,
        timestamp: new Date(event.timestamp),
        service: event.service,
        createdAt: new Date(),
      }

      await collection.insertOne(logEntry)
      this.logger.log(`Stored log: ${event.type}`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.logger.error(`Failed to store log: ${errorMessage}`)
    }
  }

  private async ensureConnection(): Promise<void> {
    try {
      await this.db.admin().ping()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.logger.error(`MongoDB connection check failed: ${errorMessage}`)
      throw new Error(`MongoDB is not connected: ${errorMessage}`)
    }
  }

  async getLogs(filters: GetLogsDto): Promise<GetLogsResponse> {
    await this.ensureConnection()
    const collection = this.db.collection<LogEntry>('logs')

    const query: Record<string, unknown> = {}
    if (filters.type) {
      query.type = filters.type
    }
    if (filters.from || filters.to) {
      query.timestamp = {}
      if (filters.from) {
        ;(query.timestamp as Record<string, unknown>).$gte = new Date(filters.from)
      }
      if (filters.to) {
        ;(query.timestamp as Record<string, unknown>).$lte = new Date(filters.to)
      }
    }

    const total = await collection.countDocuments(query)
    const skip = ((filters.page || 1) - 1) * (filters.limit || 25)

    const logs = await collection
      .find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(filters.limit || 25)
      .toArray()

    return { logs, total, page: filters.page || 1, limit: filters.limit || 25 }
  }

  async generatePdfReport(from?: string, to?: string): Promise<Buffer> {
    await this.ensureConnection()
    const collection = this.db.collection<LogEntry>('logs')

    const query: Record<string, unknown> = {}
    if (from || to) {
      query.timestamp = {}
      if (from) {
        ;(query.timestamp as Record<string, unknown>).$gte = new Date(from)
      }
      if (to) {
        ;(query.timestamp as Record<string, unknown>).$lte = new Date(to)
      }
    }

    const logs = await collection.find(query).sort({ timestamp: 1 }).toArray()

    const doc = new PDFDocument({ margin: 50, size: 'A4' })

    doc.fontSize(24).text('Events Report', { align: 'center' })
    doc.moveDown(0.5)
    doc.fontSize(12).fillColor('gray').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' })
    doc.fillColor('black')
    doc.moveDown()

    if (from || to) {
      doc.fontSize(12)
      doc.text('Date Range:', { continued: false })
      if (from) {
        doc.text(`  From: ${new Date(from).toLocaleString()}`, { indent: 20 })
      }
      if (to) {
        doc.text(`  To: ${new Date(to).toLocaleString()}`, { indent: 20 })
      }
      doc.moveDown()
    }

    if (logs.length === 0) {
      doc.fontSize(14).text('No events found for the specified period', { align: 'center' })
      return new Promise((resolve, reject) => {
        const chunks: Buffer[] = []
        doc.on('data', (chunk) => chunks.push(chunk))
        doc.on('end', () => resolve(Buffer.concat(chunks)))
        doc.on('error', reject)
        doc.end()
      })
    }

    const typeCounts: Record<string, number> = {}
    logs.forEach((log) => {
      typeCounts[log.type] = (typeCounts[log.type] || 0) + 1
    })

    doc.fontSize(14).text('Summary Statistics', { underline: true })
    doc.moveDown(0.3)
    doc.fontSize(12)
    doc.text(`Total Events: ${logs.length}`, { indent: 20 })
    doc.text(`Event Types: ${Object.keys(typeCounts).length}`, { indent: 20 })
    doc.moveDown()

    doc.fontSize(14).text('Events by Type', { underline: true })
    doc.moveDown(0.3)
    doc.fontSize(12)
    Object.entries(typeCounts)
      .sort(([, a], [, b]) => b - a)
      .forEach(([type, count]) => {
        doc.text(`${type}: ${count}`, { indent: 20 })
      })
    doc.moveDown()

    doc.fontSize(14).text('Recent Events', { underline: true })
    doc.moveDown(0.3)
    doc.fontSize(10)
    logs.slice(0, 50).forEach((log) => {
      const date = new Date(log.timestamp).toLocaleString()
      doc.text(`${date} - ${log.type} (${log.service})`, { indent: 20 })
      if (Object.keys(log.payload).length > 0) {
        doc.text(`  Payload: ${JSON.stringify(log.payload)}`, { indent: 30 })
      }
      doc.moveDown(0.2)
    })

    if (logs.length > 50) {
      doc.moveDown()
      doc
        .fontSize(10)
        .fillColor('gray')
        .text(`... and ${logs.length - 50} more events`, { indent: 20 })
      doc.fillColor('black')
    }

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = []
      doc.on('data', (chunk) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)
      doc.end()
    })
  }
}
