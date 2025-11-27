import { NestFactory } from '@nestjs/core'
import { Transport } from '@nestjs/microservices'
import { ConfigService } from '@nestjs/config'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const configService = app.get(ConfigService)

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

  await app.startAllMicroservices()
}

bootstrap()
