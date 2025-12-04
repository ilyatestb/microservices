import { ChartGeneratorUtil } from './chart-generator.util'
import { PDF_CONSTANTS } from '../constants'
import { LogEntry } from '@my-apps/shared'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument = require('pdfkit')

export interface PdfReportOptions {
  from?: string
  to?: string
}

enum AggregationTimeRange {
  MINUTE = 'minute',
  HOUR = 'hour',
  DAY = 'day',
}

export class PdfGeneratorUtil {
  static async generateLogsReportPdf(logs: LogEntry[], { from, to }: PdfReportOptions = {}): Promise<Buffer> {
    const doc = new PDFDocument({ margin: PDF_CONSTANTS.document.margin, size: PDF_CONSTANTS.document.pageSize })

    doc.fontSize(PDF_CONSTANTS.fonts.mainTitle).text('Events Report', { align: 'center' })
    doc.moveDown(PDF_CONSTANTS.spacing.afterMainTitle)
    doc
      .fontSize(PDF_CONSTANTS.fonts.bodyText)
      .fillColor(PDF_CONSTANTS.colors.secondary)
      .text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' })
    doc.fillColor(PDF_CONSTANTS.colors.primary)
    doc.moveDown()

    if (from || to) {
      doc.fontSize(PDF_CONSTANTS.fonts.bodyText)
      doc.text('Date Range:', { continued: false })
      if (from) {
        doc.text(`  From: ${new Date(from).toLocaleString()}`, { indent: PDF_CONSTANTS.spacing.textIndent })
      }
      if (to) {
        doc.text(`  To: ${new Date(to).toLocaleString()}`, { indent: PDF_CONSTANTS.spacing.textIndent })
      }
      doc.moveDown()
    }

    if (logs.length === 0) {
      doc
        .fontSize(PDF_CONSTANTS.fonts.sectionTitle)
        .text('No events found for the specified period', { align: 'center' })
      return new Promise((resolve, reject) => {
        const chunks: Buffer[] = []
        doc.on('data', (chunk) => chunks.push(chunk))
        doc.on('end', () => resolve(Buffer.concat(chunks)))
        doc.on('error', reject)
        doc.end()
      })
    }

    const typeCounts: Record<string, number> = {}
    logs.forEach((log) => {
      typeCounts[log.type] = (typeCounts[log.type] || 0) + 1
    })

    const timeSeriesData = this.aggregateLogsByTime(logs)

    try {
      const lineChartBuffer = await ChartGeneratorUtil.generateLineChart(timeSeriesData, 'Events Over Time')
      doc.image(lineChartBuffer, PDF_CONSTANTS.document.margin, doc.y + PDF_CONSTANTS.chart.verticalOffset, {
        width: PDF_CONSTANTS.chart.width,
      })
      doc.moveDown(PDF_CONSTANTS.spacing.afterChart)
    } catch (error) {
      console.error('[PDF Generator] Failed to generate chart:', error)
      doc
        .fontSize(PDF_CONSTANTS.fonts.bodyText)
        .fillColor(PDF_CONSTANTS.colors.error)
        .text('Failed to generate line chart', { align: 'center' })
      doc.fillColor(PDF_CONSTANTS.colors.primary).moveDown()
    }

    doc.moveDown(PDF_CONSTANTS.spacing.beforeSummary)

    doc.fontSize(PDF_CONSTANTS.fonts.sectionTitle).text('Summary Statistics', { underline: true })
    doc.moveDown(PDF_CONSTANTS.spacing.afterSectionTitle)
    doc.fontSize(PDF_CONSTANTS.fonts.bodyText)
    doc.text(`Total Events: ${logs.length}`, { indent: PDF_CONSTANTS.spacing.textIndent })
    doc.text(`Event Types: ${Object.keys(typeCounts).length}`, { indent: PDF_CONSTANTS.spacing.textIndent })
    doc.moveDown()

    doc.fontSize(PDF_CONSTANTS.fonts.sectionTitle).text('Events by Type', { underline: true })
    doc.moveDown(PDF_CONSTANTS.spacing.afterSectionTitle)
    doc.fontSize(PDF_CONSTANTS.fonts.bodyText)
    Object.entries(typeCounts)
      .sort(([, a], [, b]) => b - a)
      .forEach(([type, count]) => {
        doc.text(`${type}: ${count}`, { indent: PDF_CONSTANTS.spacing.textIndent })
      })
    doc.moveDown()

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = []
      doc.on('data', (chunk) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)
      doc.end()
    })
  }

  private static aggregateLogsByTime(logs: LogEntry[]): { labels: string[]; values: number[] } {
    const timeCounts: Record<string, number> = {}
    const { monthOffset, datePadLength, datePadChar } = PDF_CONSTANTS.timeAggregation
    const aggregationTimeRange = this.getAggregationTimeRange(logs)

    logs.forEach((log) => {
      const date = new Date(log.timestamp)
      let key: string

      if (aggregationTimeRange === AggregationTimeRange.MINUTE) {
        key = `${date.getFullYear()}-${String(date.getMonth() + monthOffset).padStart(datePadLength, datePadChar)}-${String(date.getDate()).padStart(datePadLength, datePadChar)} ${String(date.getHours()).padStart(datePadLength, datePadChar)}:${String(date.getMinutes()).padStart(datePadLength, datePadChar)}`
      } else if (aggregationTimeRange === AggregationTimeRange.HOUR) {
        key = `${date.getFullYear()}-${String(date.getMonth() + monthOffset).padStart(datePadLength, datePadChar)}-${String(date.getDate()).padStart(datePadLength, datePadChar)} ${String(date.getHours()).padStart(datePadLength, datePadChar)}:00`
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + monthOffset).padStart(datePadLength, datePadChar)}-${String(date.getDate()).padStart(datePadLength, datePadChar)}`
      }

      timeCounts[key] = (timeCounts[key] || 0) + 1
    })

    const sortedEntries = Object.entries(timeCounts).sort(([a], [b]) => a.localeCompare(b))

    return {
      labels: sortedEntries.map(([key]) => key),
      values: sortedEntries.map(([, value]) => value),
    }
  }

  private static getAggregationTimeRange(logs: LogEntry[]) {
    const timestamps = logs.map((log) => new Date(log.timestamp).getTime())
    const minTime = Math.min(...timestamps)
    const maxTime = Math.max(...timestamps)
    const rangeMs = maxTime - minTime

    const { minuteInMs, hourInMs, dailyThresholdHours, hourlyThresholdMinutes } = PDF_CONSTANTS.timeAggregation

    if (rangeMs <= minuteInMs * hourlyThresholdMinutes) {
      return AggregationTimeRange.MINUTE
    } else if (rangeMs <= hourInMs * dailyThresholdHours) {
      return AggregationTimeRange.HOUR
    } else {
      return AggregationTimeRange.DAY
    }
  }
}
