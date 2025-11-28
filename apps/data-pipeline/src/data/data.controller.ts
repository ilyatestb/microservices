import { Controller, Logger } from '@nestjs/common'
import { MessagePattern, Payload } from '@nestjs/microservices'
import { DataService } from './data.service'

@Controller()
export class DataController {
  private readonly logger = new Logger(DataController.name)

  constructor(private readonly dataService: DataService) {}

  @MessagePattern('data.fetch')
  async fetchData(@Payload() payload: { apiUrl: string }) {
    this.logger.log(`Received fetch request for: ${payload.apiUrl}`)
    return await this.dataService.fetchAndSaveData(payload.apiUrl)
  }

  @MessagePattern('data.upload')
  async uploadFile(@Payload() payload: { filePath: string }) {
    this.logger.log(`Received upload request for: ${payload.filePath}`)
    return await this.dataService.uploadAndParseFile(payload.filePath)
  }

  @MessagePattern('data.search')
  async searchData(@Payload() payload: { query: string; page: number; limit: number }) {
    this.logger.log(`Received search request: ${payload.query}`)
    return await this.dataService.searchData(payload.query, payload.page, payload.limit)
  }
}
