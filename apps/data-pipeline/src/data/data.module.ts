import { Module } from '@nestjs/common'
import { DataService } from './data.service'
import { DataController } from './data.controller'
import { MongodbModule } from '@my-apps/shared'
import { RedisModule } from '@my-apps/shared'

@Module({
  imports: [MongodbModule.forRoot(), RedisModule.forRoot()],
  controllers: [DataController],
  providers: [DataService],
  exports: [DataService],
})
export class DataModule {}
