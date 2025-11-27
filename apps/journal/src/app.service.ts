import { Injectable, Logger } from '@nestjs/common'
import { MessagePattern, Payload } from '@nestjs/microservices'
import { BaseIdDto } from '@my-apps/shared'

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name)

  @MessagePattern('journal_queue')
  handleJournalMessage(@Payload() data: BaseIdDto) {
    this.logger.log(`Received message from Redis queue "journal_queue": ${JSON.stringify(data)}`)
    // здесь можно добавить бизнес-логику обработки сообщения
  }
}
