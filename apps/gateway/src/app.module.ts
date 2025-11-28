import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { GatewayModule } from './modules/gateway.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env'],
    }),
    GatewayModule,
  ],
})
export class AppModule {}
