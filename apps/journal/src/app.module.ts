import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { LogsModule } from './logs/logs.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env'],
    }),
    LogsModule,
  ],
})
export class AppModule {}
