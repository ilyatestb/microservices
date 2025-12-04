import { ChartJSNodeCanvas } from 'chartjs-node-canvas'
import { ChartConfiguration } from 'chart.js'
import { CHART_CONSTANTS } from '../constants'

export interface ChartData {
  labels: string[]
  values: number[]
}

export class ChartGeneratorUtil {
  static async generateLineChart(data: ChartData, title: string): Promise<Buffer> {
    const chartJSNodeCanvas = new ChartJSNodeCanvas({
      width: CHART_CONSTANTS.dimensions.width,
      height: CHART_CONSTANTS.dimensions.height,
      backgroundColour: CHART_CONSTANTS.colors.background,
    })

    const configuration: ChartConfiguration = {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [
          {
            label: title,
            data: data.values,
            borderColor: CHART_CONSTANTS.colors.line,
            backgroundColor: CHART_CONSTANTS.colors.lineBackground,
            tension: CHART_CONSTANTS.styles.lineTension,
            fill: true,
          },
        ],
      },
      options: {
        responsive: false,
        plugins: {
          title: {
            display: true,
            text: title,
            font: {
              size: CHART_CONSTANTS.styles.titleFontSize,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: CHART_CONSTANTS.axis.yAxisBeginAtZero,
            ticks: {
              precision: CHART_CONSTANTS.axis.yAxisTicksPrecision,
            },
          },
        },
      },
    }

    return await chartJSNodeCanvas.renderToBuffer(configuration)
  }
}
