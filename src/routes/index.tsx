import fs from 'node:fs'
import path from 'node:path'
import { Link, createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { checkVisualizationExists } from '../utils/visualizations'

const getDaysList = createServerFn({ method: 'GET' }).handler(async () => {
  const days: Array<{
    day: string
    exists: boolean
    hasVisualization: boolean
  }> = []
  const inputsDir = path.join(process.cwd(), 'src', 'inputs')

  // Check which days exist (01-12)
  for (let day = 1; day <= 12; day++) {
    const dayStr = day.toString().padStart(2, '0')
    const dayPath = path.join(inputsDir, `day${dayStr}`)
    const inputPath = path.join(dayPath, 'input')

    let exists = false
    try {
      await fs.promises.access(inputPath, fs.constants.F_OK)
      exists = true
    } catch {
      exists = false
    }

    // Check if visualization exists
    const visualizationCheck = await checkVisualizationExists({
      data: { day: dayStr },
    })

    days.push({
      day: dayStr,
      exists,
      hasVisualization: visualizationCheck.exists,
    })
  }

  return { days }
})

export const Route = createFileRoute('/')({
  component: App,
  loader: async () => {
    return await getDaysList()
  },
})

function App() {
  const { days } = Route.useLoaderData()

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="mb-8 flex justify-center">
            <img
              src="/images/advent-of-code-2025.png"
              alt="Advent of Code 2025"
              className="max-w-full h-auto rounded-lg shadow-2xl border border-slate-700/50"
              style={{ maxHeight: '400px' }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {days.map(
            ({
              day,
              exists,
              hasVisualization,
            }: {
              day: string
              exists: boolean
              hasVisualization: boolean
            }) => {
              const baseClasses = `block p-6 rounded-xl border transition-all duration-300 relative overflow-hidden ${
                exists
                  ? 'bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 cursor-pointer'
                  : 'bg-slate-800/20 border-slate-700/50 opacity-50 cursor-not-allowed'
              }`

              const content = (
                <>
                  {hasVisualization && (
                    <>
                      {/* Animated gradient background */}
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-cyan-500/20 animate-pulse opacity-50" />
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-transparent to-cyan-600/10 animate-gradient-shift" />
                      {/* Badge */}
                      <div className="absolute top-2 right-2">
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-purple-500/80 to-cyan-500/80 text-white border border-purple-400/50 shadow-lg animate-pulse">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
                          </span>
                          Animation
                        </span>
                      </div>
                    </>
                  )}
                  <div className="text-center relative z-10">
                    <div
                      className={`text-3xl font-bold mb-2 ${
                        exists ? 'text-cyan-400' : 'text-gray-500'
                      }`}
                    >
                      Day {day}
                    </div>
                    {exists ? (
                      <div className="text-sm text-gray-400">
                        <div className="text-cyan-400">Available</div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">Not available</div>
                    )}
                  </div>
                </>
              )

              if (!exists) {
                return (
                  <div key={day} className={baseClasses}>
                    {content}
                  </div>
                )
              }

              return (
                <Link
                  key={day}
                  to="/puzzle/$day"
                  params={{ day }}
                  className={baseClasses}
                >
                  {content}
                </Link>
              )
            },
          )}
        </div>
      </div>
    </div>
  )
}
