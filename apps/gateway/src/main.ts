import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { Logger, ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const configService = app.get(ConfigService)
  const logger = new Logger('GatewayBootstrap')

  const port = configService.get<number>('API_GATEWAY_PORT', 5005)
  const protocol = configService.get<string>('API_GATEWAY_PROTOCOL', 'http')
  const nodeEnv = configService.get<string>('NODE_ENV')

  const config = new DocumentBuilder().setTitle('Microservices Test Task').build()
  const documentFactory = () => SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('swagger', app, documentFactory)

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  await app.listen(port)

  if (nodeEnv !== 'production') {
    const baseUrl = `${protocol}://localhost:${port}`
    logger.debug(`API available at ${baseUrl}`)
    logger.debug(`Docs available at ${baseUrl}/swagger`)
  }
}
bootstrap()
