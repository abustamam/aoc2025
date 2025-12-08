import fs from 'node:fs'
import path from 'node:path'
import { Outlet, createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import ReactMarkdown from 'react-markdown'

// Days that have visualizations
const VISUALIZATION_DAYS = new Set(['07', '08'])

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

export const Route = createFileRoute('/puzzle/$day')({
  component: PuzzlePage,
  loader: async ({ params }) => {
    const day = params.day
    return await getPuzzleContent({ data: { day } })
  },
})

function PuzzlePage() {
  const { content, day } = Route.useLoaderData()

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 relative">
          <Outlet />
          <h1 className="text-4xl font-bold text-white mb-2">
            Day {day} - Advent of Code 2025
          </h1>
          <div className="flex gap-4">
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
            {VISUALIZATION_DAYS.has(day.padStart(2, '0')) && (
              <a
                href={`/puzzle/${day}/visualization`}
                className="text-cyan-400 hover:text-cyan-300 underline"
              >
                Visualization
              </a>
            )}
          </div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8 prose prose-invert prose-headings:text-white prose-p:text-white prose-strong:text-white prose-em:text-white prose-li:text-white prose-code:text-cyan-400 prose-code:bg-slate-900/50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-700 prose-pre:text-gray-200 prose-a:text-cyan-400 prose-a:hover:text-cyan-300 max-w-none text-white">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  )
}
