import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { DataModule } from './data/data.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env'],
    }),
    DataModule,
  ],
})
export class AppModule {}
