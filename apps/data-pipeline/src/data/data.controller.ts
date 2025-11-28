import { Controller, Logger } from '@nestjs/common'
import { MessagePattern, Payload } from '@nestjs/microservices'
import { DataService } from './data.service'
import { FetchDataDto, UploadFileDto, SearchQueryDto, MessageType } from '@my-apps/shared'

@Controller()
export class DataController {
  private readonly logger = new Logger(DataController.name)

  constructor(private readonly dataService: DataService) {}

  @MessagePattern(MessageType.DATA_FETCH)
  async fetchData(@Payload() payload: FetchDataDto) {
    this.logger.log(`Received fetch request for: ${JSON.stringify(payload, null, 2)}`)
    return await this.dataService.fetchAndSaveData(payload.apiUrl)
  }

  @MessagePattern(MessageType.DATA_UPLOAD)
  async uploadFile(@Payload() payload: UploadFileDto) {
    this.logger.log(`Received upload request for: ${JSON.stringify(payload, null, 2)}`)
    return await this.dataService.uploadAndParseFile(payload.filePath)
  }

  @MessagePattern(MessageType.DATA_SEARCH)
  async searchData(@Payload() payload: SearchQueryDto) {
    this.logger.log(`Received search request: ${JSON.stringify(payload, null, 2)}`)
    return await this.dataService.searchData(payload.query || '', payload.page, payload.limit)
  }
}
