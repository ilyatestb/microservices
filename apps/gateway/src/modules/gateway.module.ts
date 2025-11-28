import { Module } from '@nestjs/common'
import { DataController } from '../controllers/data.controller'
import { LogsController } from '../controllers/logs.controller'

@Module({
  controllers: [DataController, LogsController],
})
export class GatewayModule {}
