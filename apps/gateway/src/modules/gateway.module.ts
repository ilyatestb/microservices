import { Module } from '@nestjs/common'
import { DataController } from '../controllers/data.controller'
import { LogsController } from '../controllers/logs.controller'
import { RedisClientModule } from './redis-client.module'

@Module({
  imports: [RedisClientModule],
  controllers: [DataController, LogsController],
})
export class GatewayModule {}
