import fs from 'node:fs'
import path from 'node:path'
import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: App,
  loader: async () => {
    const days = []
    const inputsDir = path.join(process.cwd(), 'src', 'inputs')

    // Check which days exist (01-12)
    for (let day = 1; day <= 12; day++) {
      const dayStr = day.toString().padStart(2, '0')
      const dayPath = path.join(inputsDir, `day${dayStr}`)
      const inputPath = path.join(dayPath, 'input')

      try {
        await fs.promises.access(inputPath, fs.constants.F_OK)
        days.push({ day: dayStr, exists: true })
      } catch {
        days.push({ day: dayStr, exists: false })
      }
    }

    return { days }
  },
})

function App() {
  const { days } = Route.useLoaderData()

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-black text-white mb-4 [letter-spacing:-0.08em]">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Advent of Code 2025
            </span>
          </h1>
          <p className="text-xl text-gray-300">
            Solve puzzles and track your progress
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {days.map(({ day, exists }) => (
            <Link
              key={day}
              to="/puzzle/$day"
              params={{ day }}
              className={`block p-6 rounded-xl border transition-all duration-300 ${
                exists
                  ? 'bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 cursor-pointer'
                  : 'bg-slate-800/20 border-slate-700/50 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="text-center">
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
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
