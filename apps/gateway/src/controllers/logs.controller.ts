import { Controller, Get, Query, HttpException, HttpStatus, Logger, Res } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger'
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices'
import { ConfigService } from '@nestjs/config'
import { Response } from 'express'
import { PaginationQueryDto, DateRangeDto } from '@my-apps/shared'

@ApiTags('Logs')
@Controller('logs')
export class LogsController {
  private readonly logger = new Logger(LogsController.name)
  private readonly logsClient: ClientProxy

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost')
    const port = this.configService.get<number>('REDIS_PORT', 6379)
    const password = this.configService.get<string | undefined>('REDIS_PASSWORD')

    this.logsClient = ClientProxyFactory.create({
      transport: Transport.REDIS,
      options: {
        host,
        port,
        password,
      },
    })
  }

  @Get()
  @ApiOperation({ summary: 'Get logs with filters' })
  @ApiQuery({ name: 'type', required: false, type: String })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 25 })
  @ApiResponse({ status: 200, description: 'Logs retrieved successfully' })
  async getLogs(
    @Query('type') type?: string,
    @Query() dateRange?: DateRangeDto,
    @Query() pagination?: PaginationQueryDto,
  ) {
    try {
      return await this.logsClient
        .send('logs.get', {
          type,
          from: dateRange?.from,
          to: dateRange?.to,
          page: pagination?.page || 1,
          limit: pagination?.limit || 25,
        })
        .toPromise()
    } catch (error) {
      this.logger.error(`Failed to get logs: ${error.message}`)
      throw new HttpException('Failed to get logs', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Get('report')
  @ApiOperation({ summary: 'Generate PDF report with charts' })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
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
  async generateReport(@Query() dateRange?: DateRangeDto, @Res() res?: Response) {
    try {
      const result = await this.logsClient
        .send('logs.report', {
          from: dateRange?.from,
          to: dateRange?.to,
        })
        .toPromise()

      const pdfBuffer = Buffer.from(result.pdf, 'base64')

      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename=report_${Date.now()}.pdf`)
      res.send(pdfBuffer)
    } catch (error) {
      this.logger.error(`Failed to generate report: ${error.message}`)
      throw new HttpException('Failed to generate report', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }
}
