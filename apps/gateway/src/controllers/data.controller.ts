import { Controller, Post, Get, Body, Query, HttpException, HttpStatus, Logger } from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger'
import { ClientProxy } from '@nestjs/microservices'
import { MessageType } from '@my-apps/shared'
import {
  FetchDataSwaggerDto,
  UploadFileSwaggerDto,
  SearchQuerySwaggerDto,
  FetchDataResponseDto,
  UploadFileResponseDto,
  SearchDataResponseDto,
} from '../dto'
import { RedisClientService } from '../modules/redis-client.service'

@ApiTags('Data')
@Controller('data')
export class DataController {
  private readonly logger = new Logger(DataController.name)
  private readonly dataClient: ClientProxy

  constructor(private readonly redisClientService: RedisClientService) {
    this.dataClient = this.redisClientService.getClient('data')
  }

  @Post('fetch')
  @ApiOperation({
    summary: 'Fetch data from public API and save to JSON file',
    description: 'Fetches data from the provided API URL and saves it to a JSON file in the data directory',
  })
  @ApiResponse({
    status: 200,
    description: 'Data fetched and saved successfully',
    type: FetchDataResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid API URL provided' })
  @ApiInternalServerErrorResponse({ description: 'Failed to fetch data from API' })
  async fetchData(@Body() body: FetchDataSwaggerDto): Promise<FetchDataResponseDto> {
    try {
      return await this.dataClient.send<FetchDataResponseDto>(MessageType.DATA_FETCH, body).toPromise()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.logger.error(`Failed to fetch data: ${errorMessage}`)
      throw new HttpException('Failed to fetch data', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Post('upload')
  @ApiOperation({
    summary: 'Upload and parse JSON file, insert into MongoDB',
    description: 'Reads a JSON file from the specified path, parses it, and inserts the data into MongoDB collection',
  })
  @ApiResponse({
    status: 200,
    description: 'File uploaded and parsed successfully',
    type: UploadFileResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid file path or file not found' })
  @ApiInternalServerErrorResponse({ description: 'Failed to upload or parse file' })
  async uploadFile(@Body() body: UploadFileSwaggerDto): Promise<UploadFileResponseDto> {
    try {
      return await this.dataClient.send<UploadFileResponseDto>(MessageType.DATA_UPLOAD, body).toPromise()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.logger.error(`Failed to upload file: ${errorMessage}`)
      throw new HttpException('Failed to upload file', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Get('search')
  @ApiOperation({
    summary: 'Search data with pagination',
    description: 'Searches data in MongoDB collection with optional query string and pagination support',
  })
  @ApiResponse({
    status: 200,
    description: 'Search results with pagination metadata',
    type: SearchDataResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid query parameters' })
  @ApiInternalServerErrorResponse({ description: 'Failed to search data' })
  async searchData(@Query() searchQuery: SearchQuerySwaggerDto): Promise<SearchDataResponseDto> {
    try {
      return await this.dataClient
        .send<SearchDataResponseDto>(MessageType.DATA_SEARCH, {
          query: searchQuery.query || '',
          page: searchQuery.page,
          limit: searchQuery.limit,
        })
        .toPromise()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.logger.error(`Failed to search data: ${errorMessage}`)
      throw new HttpException('Failed to search data', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }
}
