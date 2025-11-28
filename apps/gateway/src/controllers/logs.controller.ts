import { Controller, Get, Query, HttpException, HttpStatus, Logger, Res } from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger'
import { ClientProxy } from '@nestjs/microservices'
import { Response } from 'express'
import { MessageType } from '@my-apps/shared'
import { GetLogsSwaggerDto, DateRangeSwaggerDto, GetLogsResponseDto } from '../dto'
import { RedisClientService } from '../modules/redis-client.service'

@ApiTags('Logs')
@Controller('logs')
export class LogsController {
  private readonly logger = new Logger(LogsController.name)
  private readonly logsClient: ClientProxy

  constructor(private readonly redisClientService: RedisClientService) {
    this.logsClient = this.redisClientService.getClient('logs')
  }

  @Get()
  @ApiOperation({
    summary: 'Get logs with filters',
    description: 'Retrieves logs from MongoDB with optional filters by type, date range, and pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Logs retrieved successfully',
    type: GetLogsResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid query parameters' })
  @ApiInternalServerErrorResponse({ description: 'Failed to retrieve logs' })
  async getLogs(@Query() query: GetLogsSwaggerDto): Promise<GetLogsResponseDto> {
    try {
      return await this.logsClient
        .send<GetLogsResponseDto>(MessageType.LOGS_GET, {
          type: query.type,
          from: query.from,
          to: query.to,
          page: query.page || 1,
          limit: query.limit || 25,
        })
        .toPromise()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.logger.error(`Failed to get logs: ${errorMessage}`)
      throw new HttpException('Failed to get logs', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Get('report')
  @ApiOperation({
    summary: 'Generate PDF report with charts',
    description: 'Generates a PDF report with event statistics and charts for the specified date range',
  })
  @ApiResponse({
    status: 200,
    description: 'PDF report generated successfully',
    content: {
      'application/pdf': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid date range parameters' })
  @ApiInternalServerErrorResponse({ description: 'Failed to generate report' })
  async generateReport(@Query() dateRange?: DateRangeSwaggerDto, @Res() res?: Response): Promise<void> {
    try {
      const result = await this.logsClient
        .send<{ pdf: string }>(MessageType.LOGS_REPORT, {
          from: dateRange?.from,
          to: dateRange?.to,
        })
        .toPromise()

      if (!res) {
        throw new HttpException('Response object is required', HttpStatus.INTERNAL_SERVER_ERROR)
      }

      const pdfBuffer = Buffer.from(result.pdf, 'base64')

      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename=report_${Date.now()}.pdf`)
      res.send(pdfBuffer)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.logger.error(`Failed to generate report: ${errorMessage}`)
      throw new HttpException('Failed to generate report', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }
}
