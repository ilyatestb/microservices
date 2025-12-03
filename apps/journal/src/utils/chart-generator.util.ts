import { ChartJSNodeCanvas } from 'chartjs-node-canvas'
import { ChartConfiguration } from 'chart.js'

export interface ChartData {
  labels: string[]
  values: number[]
}

export class ChartGeneratorUtil {
  private static readonly width = 800
  private static readonly height = 400

  /**
   * Generates a line chart for data
   */
  static async generateLineChart(data: ChartData, title: string): Promise<Buffer> {
    const chartJSNodeCanvas = new ChartJSNodeCanvas({
      width: this.width,
      height: this.height,
      backgroundColour: 'white',
    })

    const configuration: ChartConfiguration = {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [
          {
            label: title,
            data: data.values,
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.1,
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
              size: 16,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0,
            },
          },
        },
      },
    }

    return await chartJSNodeCanvas.renderToBuffer(configuration)
  }
}
