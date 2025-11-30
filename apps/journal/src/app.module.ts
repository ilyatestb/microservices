import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { EntriesModule } from './entries/entries.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env'],
    }),
    EntriesModule,
  ],
})
export class AppModule {}
