import fs from 'node:fs'
import path from 'node:path'
import {
  Link,
  Outlet,
  createFileRoute,
  useLocation,
} from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import ReactMarkdown from 'react-markdown'

// Days that have visualizations
const VISUALIZATION_DAYS = new Set(['01', '07', '08'])

const getPuzzleContent = createServerFn({ method: 'GET' })
  .inputValidator((d: { day: string }) => d)
  .handler(async ({ data }) => {
    const { day } = data
    const puzzlePath = path.join(
      process.cwd(),
      'src',
      'inputs',
      `day${day}`,
      'puzzle.md',
    )

    try {
      const content = await fs.promises.readFile(puzzlePath, 'utf-8')
      return { content, day }
    } catch (error) {
      throw new Error(`Puzzle file not found for day ${day}`)
    }
  })

const checkDayExists = createServerFn({ method: 'GET' })
  .inputValidator((d: { day: string }) => d)
  .handler(async ({ data }) => {
    const { day } = data
    const inputsDir = path.join(process.cwd(), 'src', 'inputs')
    const dayPath = path.join(inputsDir, `day${day}`)
    const inputPath = path.join(dayPath, 'input')

    try {
      await fs.promises.access(inputPath, fs.constants.F_OK)
      return { exists: true }
    } catch {
      return { exists: false }
    }
  })

export const Route = createFileRoute('/puzzle/$day')({
  component: PuzzlePage,
  loader: async ({ params }) => {
    const day = params.day
    const dayNum = parseInt(day, 10)
    const prevDay = (dayNum - 1).toString().padStart(2, '0')
    const nextDay = (dayNum + 1).toString().padStart(2, '0')

    const [puzzleData, prevDayExists, nextDayExists] = await Promise.all([
      getPuzzleContent({ data: { day } }),
      dayNum > 1
        ? checkDayExists({ data: { day: prevDay } })
        : Promise.resolve({ exists: false }),
      dayNum < 25
        ? checkDayExists({ data: { day: nextDay } })
        : Promise.resolve({ exists: false }),
    ])

    return {
      ...puzzleData,
      prevDayExists: prevDayExists.exists,
      nextDayExists: nextDayExists.exists,
    }
  },
})

function PuzzlePage() {
  const { content, day, prevDayExists, nextDayExists } = Route.useLoaderData()
  const location = useLocation()
  const dayNum = parseInt(day, 10)
  const prevDay = (dayNum - 1).toString().padStart(2, '0')
  const nextDay = (dayNum + 1).toString().padStart(2, '0')

  // Check if we're on a child route (input, solve, visualization)
  const isChildRoute = location.pathname !== `/puzzle/${day}`
  const isVisualization = location.pathname.includes('/visualization')

  // Determine the page title based on the route
  let pageTitle = `Day ${day} - Advent of Code 2025`
  if (location.pathname.includes('/input')) {
    pageTitle = `Day ${day} - Input`
  } else if (location.pathname.includes('/solve')) {
    pageTitle = `Day ${day} - Solver`
  } else if (location.pathname.includes('/visualization')) {
    pageTitle = `Day ${day} - Visualization`
  }

  // Check which link is active
  const isPuzzleActive = location.pathname === `/puzzle/${day}`
  const isInputActive = location.pathname === `/puzzle/${day}/input`
  const isSolveActive = location.pathname === `/puzzle/${day}/solve`
  const isVisualizationActive =
    location.pathname === `/puzzle/${day}/visualization`

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
      <div
        className={isVisualization ? 'max-w-6xl mx-auto' : 'max-w-4xl mx-auto'}
      >
        {/* Navigation and header - always shown above Outlet */}
        <div className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <Link
              to="/"
              className="text-cyan-400 hover:text-cyan-300 underline flex items-center gap-2"
            >
              ← Back to Puzzle List
            </Link>
            <div className="flex gap-4">
              {dayNum > 1 &&
                (prevDayExists ? (
                  <Link
                    to="/puzzle/$day"
                    params={{ day: prevDay }}
                    className="text-cyan-400 hover:text-cyan-300 underline"
                  >
                    ← Day {prevDay}
                  </Link>
                ) : (
                  <span className="text-gray-500 cursor-not-allowed">
                    ← Day {prevDay}
                  </span>
                ))}
              {dayNum < 25 &&
                (nextDayExists ? (
                  <Link
                    to="/puzzle/$day"
                    params={{ day: nextDay }}
                    className="text-cyan-400 hover:text-cyan-300 underline"
                  >
                    Day {nextDay} →
                  </Link>
                ) : (
                  <span className="text-gray-500 cursor-not-allowed">
                    Day {nextDay} →
                  </span>
                ))}
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">{pageTitle}</h1>
          <div className="flex gap-4">
            {isPuzzleActive ? (
              <span className="text-gray-500 cursor-not-allowed">
                View Puzzle
              </span>
            ) : (
              <Link
                to="/puzzle/$day"
                params={{ day }}
                className="text-cyan-400 hover:text-cyan-300 underline"
              >
                View Puzzle
              </Link>
            )}
            {isInputActive ? (
              <span className="text-gray-500 cursor-not-allowed">
                View Input
              </span>
            ) : (
              <Link
                to="/puzzle/$day/input"
                params={{ day }}
                className="text-cyan-400 hover:text-cyan-300 underline"
              >
                View Input
              </Link>
            )}
            {isSolveActive ? (
              <span className="text-gray-500 cursor-not-allowed">Solve</span>
            ) : (
              <Link
                to="/puzzle/$day/solve"
                params={{ day }}
                className="text-cyan-400 hover:text-cyan-300 underline"
              >
                Solve
              </Link>
            )}
            {VISUALIZATION_DAYS.has(day.padStart(2, '0')) &&
              (isVisualizationActive ? (
                <span className="text-gray-500 cursor-not-allowed">
                  Visualization
                </span>
              ) : (
                <Link
                  to="/puzzle/$day/visualization"
                  params={{ day }}
                  className="text-cyan-400 hover:text-cyan-300 underline"
                >
                  Visualization
                </Link>
              ))}
          </div>
        </div>

        {/* Child route content */}
        <Outlet />

        {/* Puzzle content - only show on base route */}
        {!isChildRoute && (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8 prose prose-invert prose-headings:text-white prose-p:text-white prose-strong:text-white prose-em:text-white prose-li:text-white prose-code:text-cyan-400 prose-code:bg-slate-900/50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-700 prose-pre:text-gray-200 prose-a:text-cyan-400 prose-a:hover:text-cyan-300 max-w-none text-white">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  )
}
