import { Controller, Logger } from '@nestjs/common'
import { MessagePattern, Payload } from '@nestjs/microservices'
import { EntriesService } from './entries.service'
import { GetLogsDto, DateRangeDto, GetLogsResponse, GenerateReportResponse, MessageType } from '@my-apps/shared'

@Controller()
export class EntriesController {
  private readonly logger = new Logger(EntriesController.name)

  constructor(private readonly entriesService: EntriesService) {}

  @MessagePattern(MessageType.LOGS_GET)
  async getLogs(@Payload() payload: GetLogsDto): Promise<GetLogsResponse> {
    this.logger.log(`Received get logs request`)
    return this.entriesService.getLogs(payload)
  }

  @MessagePattern(MessageType.LOGS_REPORT)
  async generateReport(@Payload() payload: DateRangeDto): Promise<GenerateReportResponse> {
    this.logger.log(`Received generate report request`)
    const pdfBuffer = await this.entriesService.generatePdfReport(payload.from, payload.to)
    return { pdf: pdfBuffer.toString('base64') }
  }
}
