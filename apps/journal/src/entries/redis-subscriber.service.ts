import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import Redis from 'ioredis'
import { REDIS_CLIENT } from '@my-apps/shared'
import { Event } from '@my-apps/shared'

@Injectable()
export class RedisSubscriberService {
  private readonly logger = new Logger(RedisSubscriberService.name)
  private subscriber: Redis | null = null

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async subscribe(channel: string, onMessage: (event: Event) => Promise<void>): Promise<void> {
    try {
      this.logger.log(`Setting up Redis subscriber for channel: ${channel}`)

      this.subscriber = this.redis.duplicate()

      this.subscriber.on('connect', () => {
        this.logger.log('Redis subscriber connected')
      })

      this.subscriber.on('ready', async () => {
        this.logger.log(`Redis subscriber ready, subscribing to channel: ${channel}`)
        try {
          const count = await this.subscriber!.subscribe(channel)
          this.logger.log(`Successfully subscribed to channel: ${channel}, active subscriptions: ${count}`)
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          this.logger.error(`Failed to subscribe to channel: ${errorMessage}`)
        }
      })

      this.subscriber.on('message', async (receivedChannel, message) => {
        this.logger.log(`Received message on channel: ${receivedChannel}, message length: ${message.length}`)
        try {
          const event = JSON.parse(message) as Event
          this.logger.log(`Processing event: ${event.type} from service: ${event.service}`)
          await onMessage(event)
          this.logger.log(`Successfully processed event: ${event.type}`)
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          this.logger.error(`Failed to process event: ${errorMessage}`)
        }
      })

      this.subscriber.on('error', (error) => {
        const errorMessage = error instanceof Error ? error.message : String(error)
        this.logger.error(`Redis subscriber error: ${errorMessage}`)
      })

      this.subscriber.on('reconnecting', () => {
        this.logger.warn('Redis subscriber reconnecting...')
      })

      this.subscriber.on('close', () => {
        this.logger.warn('Redis subscriber connection closed')
      })

      // Check if already connected and subscribe immediately
      if (this.subscriber.status === 'ready') {
        this.logger.log('Redis subscriber already ready, subscribing immediately')
        try {
          const count = await this.subscriber.subscribe(channel)
          this.logger.log(`Immediately subscribed to channel: ${channel}, active subscriptions: ${count}`)
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          this.logger.error(`Failed to subscribe immediately: ${errorMessage}`)
        }
      } else {
        this.logger.log(`Redis subscriber status: ${this.subscriber.status}, waiting for ready event`)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.logger.error(`Failed to setup event subscription: ${errorMessage}`)
    }
  }
}
