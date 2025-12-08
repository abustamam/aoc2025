import path from 'node:path'
import fs from 'node:fs'
import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { Day01Visualization } from '../components/visualizations/Day01Visualization'
import { Day07Visualization } from '../components/visualizations/Day07Visualization'
import { Day08Visualization } from '../components/visualizations/Day08Visualization'

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

// Days that have visualizations
const VISUALIZATION_DAYS = new Set(['01', '07', '08'])

export const Route = createFileRoute('/puzzle/$day/visualization')({
  component: VisualizationPage,
  loader: async ({ params }) => {
    const day = params.day
    const dayPadded = day.padStart(2, '0')

    if (!VISUALIZATION_DAYS.has(dayPadded)) {
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
      case '07':
        return <Day07Visualization input={input} />
      case '08':
        return <Day08Visualization input={input} />
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
