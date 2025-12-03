import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { Inject } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Db, Collection, IndexDescription, OptionalId } from 'mongodb'
import Redis from 'ioredis'
import axios from 'axios'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { formatPaginatedResponse, MONGODB_DB, preparePagination } from '@my-apps/shared'
import { REDIS_CLIENT } from '@my-apps/shared'
import {
  FetchDataResponse,
  UploadFileResponse,
  SearchDataResponse,
  DataDocument,
  Event,
  EventType,
  DataFetchEventPayload,
  DataUploadEventPayload,
  DataSearchEventPayload,
  PubSubChannel,
  buildDynamicSearchQuery,
} from '@my-apps/shared'

@Injectable()
export class DataService implements OnModuleInit {
  private readonly logger = new Logger(DataService.name)
  private readonly dataDir: string

  constructor(
    @Inject(MONGODB_DB) private readonly db: Db,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly configService: ConfigService,
  ) {
    this.dataDir = this.configService.get<string>('DATA_DIR', './data')
  }

  async onModuleInit(): Promise<void> {
    try {
      const collection = this.db.collection<DataDocument>('data')
      await this.ensureIndexes(collection)
      this.logger.log('Database indexes initialized successfully')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.logger.error(`Failed to initialize indexes: ${errorMessage}`)
    }
  }

  async fetchAndSaveData(apiUrl: string): Promise<FetchDataResponse> {
    this.logger.log(`Fetching data from ${apiUrl}`)
    await this.publishEvent(EventType.DATA_FETCH_STARTED, { apiUrl })
    try {
      const response = await axios.get<unknown>(apiUrl)
      const data = response.data

      await mkdir(this.dataDir, { recursive: true })
      const fileName = `data_${Date.now()}.json`
      const filePath = join(this.dataDir, fileName)

      await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')

      const recordCount = Array.isArray(data) ? data.length : 1

      await this.publishEvent(EventType.DATA_FETCH_COMPLETED, {
        apiUrl,
        filePath,
        recordCount,
      })

      this.logger.log(`Data saved to ${filePath}, records: ${recordCount}`)
      return { filePath, recordCount }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      await this.publishEvent(EventType.DATA_FETCH_FAILED, { apiUrl, error: errorMessage })
      throw error
    }
  }

  async uploadAndParseFile(filename: string, content: string): Promise<UploadFileResponse> {
    this.logger.log(`Uploading and parsing file: ${filename}`)
    await this.publishEvent(EventType.DATA_UPLOAD_STARTED, { filename })

    try {
      const fileBuffer = Buffer.from(content, 'base64')
      const fileContent = fileBuffer.toString('utf-8')
      const data = JSON.parse(fileContent) as DataDocument | DataDocument[]

      const collection = this.db.collection<DataDocument>('data')
      const documents = (Array.isArray(data) ? data : [data]) as OptionalId<DataDocument>[]

      this.logger.log(`Inserting ${documents.length} documents into collection 'data'`)
      const result = await collection.insertMany(documents, { ordered: false })

      await this.publishEvent(EventType.DATA_UPLOAD_COMPLETED, {
        filename,
        insertedCount: result.insertedCount,
      })

      this.logger.log(`Successfully inserted ${result.insertedCount} documents into MongoDB collection 'data'`)
      return { insertedCount: result.insertedCount }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.logger.error(`Failed to upload file: ${errorMessage}`)
      await this.publishEvent(EventType.DATA_UPLOAD_FAILED, { filename, error: errorMessage })
      throw error
    }
  }

  async searchData(query: string, page: number, limit: number): Promise<SearchDataResponse> {
    this.logger.log(`Searching data with query: ${query}, page: ${page}, limit: ${limit}`)
    await this.publishEvent(EventType.DATA_SEARCH_STARTED, { query, page, limit })

    try {
      const collection = this.db.collection<DataDocument>('data')

      const searchFilter = await buildDynamicSearchQuery(collection, query)

      const { params, query: paginationQuery } = preparePagination(page, limit)

      const total = await collection.countDocuments(searchFilter)

      const data = await collection.find(searchFilter).skip(paginationQuery.skip).limit(paginationQuery.limit).toArray()

      await this.publishEvent(EventType.DATA_SEARCH_COMPLETED, {
        query,
        page: params.page,
        limit: params.limit,
        total,
        found: data.length,
      })

      return formatPaginatedResponse(data, total, params)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      await this.publishEvent(EventType.DATA_SEARCH_FAILED, { query, page, limit, error: errorMessage })
      throw error
    }
  }

  private async ensureIndexes(collection: Collection<DataDocument>): Promise<void> {
    try {
      const indexes = await collection.indexes()
      const hasTextIndex = indexes.some((idx: IndexDescription) => idx.name === 'text_index')
      if (!hasTextIndex) {
        await collection.createIndex({ '$**': 'text' }, { name: 'text_index' })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.logger.warn(`Index creation warning: ${errorMessage}`)
    }
  }

  private async publishEvent(
    eventType: EventType | string,
    payload: DataFetchEventPayload | DataUploadEventPayload | DataSearchEventPayload,
  ): Promise<void> {
    try {
      const timestamp = Date.now()
      const event: Event = {
        type: eventType,
        payload,
        timestamp,
        service: 'data-pipeline',
      }

      await this.redis.publish(PubSubChannel.EVENTS, JSON.stringify(event))

      const timeSeriesKey = `events:${eventType}`
      try {
        await this.redis.call('TS.ADD', timeSeriesKey, '*', '1', 'RETENTION', '86400000')
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        if (errorMessage?.includes('key does not exist')) {
          await this.redis.call('TS.CREATE', timeSeriesKey, 'RETENTION', '86400000')
          await this.redis.call('TS.ADD', timeSeriesKey, '*', '1')
        } else {
          throw error
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.logger.error(`Failed to publish event: ${errorMessage}`)
    }
  }
}
