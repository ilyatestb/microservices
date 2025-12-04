import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpException,
  HttpStatus,
  Logger,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger'
import { ClientProxy } from '@nestjs/microservices'
import { MessageType, isWildcardError } from '@my-apps/shared'
import {
  FetchDataSwaggerDto,
  SearchQuerySwaggerDto,
  FetchDataResponseDto,
  UploadFileResponseDto,
  SearchDataResponseDto,
  UploadFileSwaggerDto,
} from '../dto'
import { RedisClientService } from '../modules/redis-client.service'
import { FileInterceptor } from '@nestjs/platform-express'
import { Express } from 'express'
import { firstValueFrom } from 'rxjs'

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
      return firstValueFrom(this.dataClient.send<FetchDataResponseDto>(MessageType.DATA_FETCH, body))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.logger.error(`Failed to fetch data: ${errorMessage}`)
      throw new HttpException('Failed to fetch data', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Post('upload')
  @ApiOperation({
    summary: 'Upload and parse JSON file, insert into MongoDB',
    description: 'Reads a JSON file from the request, parses it, and inserts the data into MongoDB collection',
  })
  @ApiResponse({
    status: 201,
    description: 'File uploaded and parsed successfully',
    type: UploadFileResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid file type or file size' })
  @ApiInternalServerErrorResponse({ description: 'Failed to upload or parse file' })
  @ApiBody({ type: UploadFileSwaggerDto })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 1024 * 1024 * 10,
      },
      fileFilter: (req, file, cb) => {
        if (file.mimetype !== 'application/json') {
          return cb(new BadRequestException('Only JSON files are allowed'), false)
        }
        cb(null, true)
      },
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File): Promise<UploadFileResponseDto> {
    if (!file) {
      throw new BadRequestException('File is required')
    }
    try {
      const content = file.buffer.toString('base64')
      const filename = file.originalname

      this.logger.log(`Sending file content to data service: ${filename} (${file.size} bytes)`)

      return firstValueFrom(this.dataClient.send<UploadFileResponseDto>(MessageType.DATA_UPLOAD, { filename, content }))
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
      return firstValueFrom(
        this.dataClient.send<SearchDataResponseDto>(MessageType.DATA_SEARCH, {
          query: searchQuery.query || '',
          page: searchQuery.page,
          limit: searchQuery.limit,
        }),
      )
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.logger.error(`Failed to search data: ${errorMessage}`)
      if (isWildcardError(error)) {
        throw new BadRequestException(error.message)
      }

      throw new HttpException('Failed to search data', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }
}
