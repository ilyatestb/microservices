import { Controller, Post, Get, Body, Query, HttpException, HttpStatus, Logger } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody } from '@nestjs/swagger'
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices'
import { ConfigService } from '@nestjs/config'
import { PaginationQueryDto } from '@my-apps/shared'

@ApiTags('Data')
@Controller('data')
export class DataController {
  private readonly logger = new Logger(DataController.name)
  private readonly dataClient: ClientProxy

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost')
    const port = this.configService.get<number>('REDIS_PORT', 6379)
    const password = this.configService.get<string | undefined>('REDIS_PASSWORD')

    this.dataClient = ClientProxyFactory.create({
      transport: Transport.REDIS,
      options: {
        host,
        port,
        password,
      },
    })
  }

  @Post('fetch')
  @ApiOperation({ summary: 'Fetch data from public API and save to JSON file' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        apiUrl: {
          type: 'string',
          example: 'https://jsonplaceholder.typicode.com/posts',
        },
      },
      required: ['apiUrl'],
    },
  })
  @ApiResponse({ status: 200, description: 'Data fetched and saved successfully' })
  async fetchData(@Body() body: { apiUrl: string }) {
    try {
      return await this.dataClient.send('data.fetch', body).toPromise()
    } catch (error) {
      this.logger.error(`Failed to fetch data: ${error.message}`)
      throw new HttpException('Failed to fetch data', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Post('upload')
  @ApiOperation({ summary: 'Upload and parse JSON file, insert into MongoDB' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        filePath: {
          type: 'string',
          example: './data/data_1234567890.json',
        },
      },
      required: ['filePath'],
    },
  })
  @ApiResponse({ status: 200, description: 'File uploaded and parsed successfully' })
  async uploadFile(@Body() body: { filePath: string }) {
    try {
      return await this.dataClient.send('data.upload', body).toPromise()
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error.message}`)
      throw new HttpException('Failed to upload file', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Get('search')
  @ApiOperation({ summary: 'Search data with pagination' })
  @ApiQuery({ name: 'query', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 25 })
  @ApiResponse({ status: 200, description: 'Search results' })
  async searchData(@Query('query') query: string = '', @Query() pagination: PaginationQueryDto) {
    try {
      return await this.dataClient
        .send('data.search', {
          query,
          page: pagination.page || 1,
          limit: pagination.limit || 25,
        })
        .toPromise()
    } catch (error) {
      this.logger.error(`Failed to search data: ${error.message}`)
      throw new HttpException('Failed to search data', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }
}
