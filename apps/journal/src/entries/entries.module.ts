import { Module } from '@nestjs/common'
import { EntriesService } from './entries.service'
import { EntriesController } from './entries.controller'
import { MongodbModule } from '@my-apps/shared'
import { RedisModule } from '@my-apps/shared'
import { RedisSubscriberService } from './redis-subscriber.service'

@Module({
  imports: [MongodbModule.forRoot(), RedisModule.forRoot()],
  controllers: [EntriesController],
  providers: [EntriesService, RedisSubscriberService],
  exports: [EntriesService],
})
export class EntriesModule {}
