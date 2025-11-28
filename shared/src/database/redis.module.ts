import { DynamicModule, Global, Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import Redis from 'ioredis'

export const REDIS_CLIENT = 'REDIS_CLIENT'

@Global()
@Module({})
export class RedisModule {
  static forRoot(): DynamicModule {
    return {
      module: RedisModule,
      imports: [ConfigModule],
      providers: [
        {
          provide: REDIS_CLIENT,
          inject: [ConfigService],
          useFactory: (configService: ConfigService): Redis => {
            const host = configService.get<string>('REDIS_HOST', 'localhost')
            const port = configService.get<number>('REDIS_PORT', 6379)
            const password = configService.get<string | undefined>('REDIS_PASSWORD')

            return new Redis({
              host,
              port,
              password,
              retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000)
                return delay
              },
            })
          },
        },
      ],
      exports: [REDIS_CLIENT],
    }
  }
}
