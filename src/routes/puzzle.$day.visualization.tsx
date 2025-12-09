import path from 'node:path'
import fs from 'node:fs'
import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { Day01Visualization } from '../components/visualizations/Day01Visualization'
import { Day03Visualization } from '../components/visualizations/Day03Visualization'
import { Day04Visualization } from '../components/visualizations/Day04Visualization'
import { Day07Visualization } from '../components/visualizations/Day07Visualization'
import { Day08Visualization } from '../components/visualizations/Day08Visualization'
import { Day09Visualization } from '../components/visualizations/Day09Visualization'
import { checkVisualizationExists } from '../utils/visualizations'

const getVisualizationData = createServerFn({ method: 'GET' })
  .inputValidator((d: { day: string }) => d)
  .handler(async ({ data }) => {
    const { day } = data
    const dayPadded = day.padStart(2, '0')
    const inputPath = path.join(
      process.cwd(),
      'src',
      'inputs',
      `day${dayPadded}`,
      'input',
    )

    try {
      const input = await fs.promises.readFile(inputPath, 'utf-8')
      return { input, day }
    } catch (error) {
      throw new Error(`Input file not found for day ${day}`)
    }
  })

export const Route = createFileRoute('/puzzle/$day/visualization')({
  component: VisualizationPage,
  loader: async ({ params }) => {
    const day = params.day
    const visualizationExists = await checkVisualizationExists({
      data: { day },
    })

    if (!visualizationExists.exists) {
      throw new Error(`No visualization available for day ${day}`)
    }

    return await getVisualizationData({ data: { day } })
  },
})

function VisualizationPage() {
  const { input, day } = Route.useLoaderData()
  const dayPadded = day.padStart(2, '0')

  const renderVisualization = () => {
    switch (dayPadded) {
      case '01':
        return <Day01Visualization input={input} />
      case '03':
        return <Day03Visualization input={input} />
      case '04':
        return <Day04Visualization input={input} />
      case '07':
        return <Day07Visualization input={input} />
      case '08':
        return <Day08Visualization input={input} />
      case '09':
        return <Day09Visualization input={input} />
      default:
        return (
          <div className="text-white text-center py-8">
            No visualization available for day {day}
          </div>
        )
    }
  }

  return <div className="max-w-6xl">{renderVisualization()}</div>
}
