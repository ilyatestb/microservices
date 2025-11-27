import { Injectable, Logger } from '@nestjs/common'
import { EventPattern, Payload } from '@nestjs/microservices'
import { BaseIdDto } from '@my-apps/shared'

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name)

  @EventPattern('data_pipeline_queue')
  handleDataPipelineEvent(@Payload() payload: BaseIdDto) {
    this.logger.log(`Processing data pipeline event: ${JSON.stringify(payload)}`)
    // здесь может быть основная бизнес-логика обработки данных
  }
}
