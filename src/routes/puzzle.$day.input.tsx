import fs from 'node:fs'
import path from 'node:path'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/puzzle/$day/input')({
  component: InputPage,
  loader: async ({ params }) => {
    const day = params.day
    const inputPath = path.join(
      process.cwd(),
      'src',
      'inputs',
      `day${day}`,
      'input',
    )

    try {
      const content = await fs.promises.readFile(inputPath, 'utf-8')
      return { content, day }
    } catch (error) {
      throw new Error(`Input file not found for day ${day}`)
    }
  },
})

function InputPage() {
  const { content, day } = Route.useLoaderData()

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-white mb-2">
            Day {day} - Input
          </h1>
          <div className="flex gap-4">
            <a
              href={`/puzzle/${day}`}
              className="text-cyan-400 hover:text-cyan-300 underline"
            >
              View Puzzle
            </a>
            <a
              href={`/puzzle/${day}/solve`}
              className="text-cyan-400 hover:text-cyan-300 underline"
            >
              Solve
            </a>
          </div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8">
          <pre className="text-gray-300 font-mono text-sm whitespace-pre-wrap break-words">
            {content}
          </pre>
        </div>
      </div>
    </div>
  )
}
