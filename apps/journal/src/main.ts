import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { Transport } from '@nestjs/microservices'
import { ConfigService } from '@nestjs/config'
import { Logger } from '@nestjs/common'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const configService = app.get(ConfigService)
  const logger = new Logger('Bootstrap')

  const host = configService.get<string>('REDIS_HOST', 'localhost')
  const port = configService.get<number>('REDIS_PORT', 6379)
  const password = configService.get<string | undefined>('REDIS_PASSWORD')

  app.connectMicroservice({
    transport: Transport.REDIS,
    options: {
      host,
      port,
      password,
    },
  })

  await app.init()
  await app.startAllMicroservices()

  logger.log('Journal service started and listening for events')
}

bootstrap()
