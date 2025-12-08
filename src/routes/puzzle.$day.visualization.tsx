import path from 'node:path'
import fs from 'node:fs'
import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
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
const VISUALIZATION_DAYS = new Set(['07', '08'])

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-white mb-2">
            Day {day} - Visualization
          </h1>
          <div className="flex gap-4">
            <a
              href={`/puzzle/${day}`}
              className="text-cyan-400 hover:text-cyan-300 underline"
            >
              View Puzzle
            </a>
            <a
              href={`/puzzle/${day}/input`}
              className="text-cyan-400 hover:text-cyan-300 underline"
            >
              View Input
            </a>
            <a
              href={`/puzzle/${day}/solve`}
              className="text-cyan-400 hover:text-cyan-300 underline"
            >
              Solve
            </a>
          </div>
        </div>
        {renderVisualization()}
      </div>
    </div>
  )
}
