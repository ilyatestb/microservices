import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices'

@Injectable()
export class RedisClientService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisClientService.name)
  private readonly clients: Map<string, ClientProxy> = new Map()

  constructor(private readonly configService: ConfigService) {}

  getClient(name: string): ClientProxy {
    if (!this.clients.has(name)) {
      const host = this.configService.get<string>('REDIS_HOST', 'localhost')
      const port = this.configService.get<number>('REDIS_PORT', 6379)
      const password = this.configService.get<string | undefined>('REDIS_PASSWORD')

      const client = ClientProxyFactory.create({
        transport: Transport.REDIS,
        options: {
          host,
          port,
          password,
        },
      })

      this.clients.set(name, client)
    }

    return this.clients.get(name)!
  }

  async onModuleDestroy() {
    for (const [name, client] of this.clients.entries()) {
      try {
        await client.close()
      } catch (error) {
        this.logger.error(`Failed to close Redis client "${name}":`, error)
      }
    }
    this.clients.clear()
  }
}
