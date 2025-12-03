import { ChartGeneratorUtil } from './chart-generator.util'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument = require('pdfkit')

export interface PdfReportOptions {
  from?: string
  to?: string
}

export interface LogEntryForReport {
  type: string
  service: string
  timestamp: Date
  payload: Record<string, unknown>
}

export class PdfGeneratorUtil {
  static async generateLogsReportPdf(logs: LogEntryForReport[], { from, to }: PdfReportOptions = {}): Promise<Buffer> {
    const doc = new PDFDocument({ margin: 50, size: 'A4' })

    doc.fontSize(24).text('Events Report', { align: 'center' })
    doc.moveDown(0.5)
    doc.fontSize(12).fillColor('gray').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' })
    doc.fillColor('black')
    doc.moveDown()

    if (from || to) {
      doc.fontSize(12)
      doc.text('Date Range:', { continued: false })
      if (from) {
        doc.text(`  From: ${new Date(from).toLocaleString()}`, { indent: 20 })
      }
      if (to) {
        doc.text(`  To: ${new Date(to).toLocaleString()}`, { indent: 20 })
      }
      doc.moveDown()
    }

    if (logs.length === 0) {
      doc.fontSize(14).text('No events found for the specified period', { align: 'center' })
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
      doc.image(lineChartBuffer, 50, doc.y + 10, { width: 500 })
      doc.moveDown(15)
    } catch (error) {
      console.error('[PDF Generator] Failed to generate chart:', error)
      doc.fontSize(12).fillColor('red').text('Failed to generate line chart', { align: 'center' })
      doc.fillColor('black').moveDown()
    }

    doc.moveDown(7)

    doc.fontSize(14).text('Summary Statistics', { underline: true })
    doc.moveDown(0.3)
    doc.fontSize(12)
    doc.text(`Total Events: ${logs.length}`, { indent: 20 })
    doc.text(`Event Types: ${Object.keys(typeCounts).length}`, { indent: 20 })
    doc.moveDown()

    doc.fontSize(14).text('Events by Type', { underline: true })
    doc.moveDown(0.3)
    doc.fontSize(12)
    Object.entries(typeCounts)
      .sort(([, a], [, b]) => b - a)
      .forEach(([type, count]) => {
        doc.text(`${type}: ${count}`, { indent: 20 })
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

  private static aggregateLogsByTime(logs: LogEntryForReport[]): { labels: string[]; values: number[] } {
    const timeCounts: Record<string, number> = {}

    const timestamps = logs.map((log) => new Date(log.timestamp).getTime())
    const minTime = Math.min(...timestamps)
    const maxTime = Math.max(...timestamps)
    const rangeDays = (maxTime - minTime) / (1000 * 60 * 60 * 24)

    const useHours = rangeDays <= 2

    logs.forEach((log) => {
      const date = new Date(log.timestamp)
      let key: string

      if (useHours) {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      }

      timeCounts[key] = (timeCounts[key] || 0) + 1
    })

    const sortedEntries = Object.entries(timeCounts).sort(([a], [b]) => a.localeCompare(b))

    return {
      labels: sortedEntries.map(([key]) => key),
      values: sortedEntries.map(([, value]) => value),
    }
  }
}
