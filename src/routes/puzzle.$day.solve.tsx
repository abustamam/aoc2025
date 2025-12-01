import fs from 'node:fs'
import path from 'node:path'
import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { CodeHighlight } from '../components/CodeHighlight'
import { getSolver } from '../solvers'

const runSolverFn = createServerFn({ method: 'POST' })
  .inputValidator((d: { day: string; input: string }) => d)
  .handler(async ({ data }) => {
    const { day, input } = data
    try {
      const dayPadded = day.padStart(2, '0')
      const solver = getSolver(day)
      if (!solver) {
        throw new Error(
          `Solver not found for day ${day} (padded: ${dayPadded}).\n\n` +
            `To add a solver:\n` +
            `1. Create src/solvers/day${dayPadded}.ts with a solve function\n` +
            `2. Import it in src/solvers/index.ts and add it to the solvers object`,
        )
      }

      if (typeof solver.solve !== 'function') {
        throw new Error(
          `Solver for day ${day} does not have a solve function. Solver object: ${JSON.stringify(Object.keys(solver))}`,
        )
      }

      const solution = await solver.solve(input)
      return {
        success: true,
        result:
          typeof solution === 'object'
            ? JSON.stringify(solution, null, 2)
            : String(solution),
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unknown error occurred while running solver',
      }
    }
  })

const getSolveData = createServerFn({ method: 'GET' })
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
    const solverPath = path.join(
      process.cwd(),
      'src',
      'solvers',
      `day${dayPadded}.ts`,
    )

    try {
      const input = await fs.promises.readFile(inputPath, 'utf-8')
      let solverCode: string | null = null
      try {
        solverCode = await fs.promises.readFile(solverPath, 'utf-8')
      } catch {
        // Solver file doesn't exist yet, that's okay
      }
      return { input, day, solverCode }
    } catch (error) {
      throw new Error(`Input file not found for day ${day}`)
    }
  })

export const Route = createFileRoute('/puzzle/$day/solve')({
  component: SolvePage,
  loader: async ({ params }) => {
    const day = params.day
    return await getSolveData({ data: { day } })
  },
})

function SolvePage() {
  const { input, day, solverCode } = Route.useLoaderData()
  const [result, setResult] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)

  const runSolver = async () => {
    setIsRunning(true)
    try {
      const response = await runSolverFn({ data: { day, input } })
      if (response.success) {
        setResult(response.result)
      } else {
        setResult(
          `Error: ${response.error}\n\n` +
            `Make sure you have created src/solvers/day${day}.ts with a solve function.`,
        )
      }
    } catch (error) {
      setResult(
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}\n\n` +
          `Make sure you have created src/solvers/day${day}.ts with a solve function.`,
      )
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-white mb-2">
            Day {day} - Solver
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
          </div>
        </div>

        <div className="mb-6">
          <button
            onClick={runSolver}
            disabled={isRunning}
            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-500/50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors shadow-lg shadow-cyan-500/50"
          >
            {isRunning ? 'Running...' : 'Run Solver'}
          </button>
        </div>

        {result !== null && (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8 mb-6">
            <h2 className="text-2xl font-bold text-white mb-4">Result:</h2>
            <CodeHighlight
              code={result}
              language="source.ts"
              showLineNumbers
              className="bg-[#1e1e1e]"
            />
          </div>
        )}

        {solverCode && (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8 mb-6">
            <h2 className="text-2xl font-bold text-white mb-4">
              Solver Code ({`src/solvers/day${day.padStart(2, '0')}.ts`}):
            </h2>
            <CodeHighlight
              code={solverCode}
              language="source.ts"
              showLineNumbers
              className="bg-[#1e1e1e]"
            />
          </div>
        )}

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-white mb-4">
            How to add your solver:
          </h2>
          <div className="text-gray-300 space-y-4">
            <p>
              Create a file at{' '}
              <code className="text-cyan-400">
                src/solvers/day{day.padStart(2, '0')}.ts
              </code>{' '}
              with the following structure:
            </p>
            <CodeHighlight
              code={`export async function solve(input: string): Promise<string | number | object> {
  // Your solution here
  // The input parameter contains the puzzle input as a string
  
  // Example:
  const lines = input.trim().split('\\n');
  
  // Process and return your answer
  return 'Your answer here';
}`}
              language="source.ts"
              showLineNumbers
              className="bg-[#1e1e1e]"
            />
            <p className="mt-4">
              Then, import it in{' '}
              <code className="text-cyan-400">src/solvers/index.ts</code> and
              add it to the solvers object:
            </p>
            <CodeHighlight
              code={`import * as day${day.padStart(2, '0')} from './day${day.padStart(2, '0')}'

export const solvers = {
  // ... existing solvers
  '${day.padStart(2, '0')}': day${day.padStart(2, '0')},
}`}
              language="source.ts"
              showLineNumbers
              className="bg-[#1e1e1e]"
            />
            <p className="mt-4">
              The solver function will receive the puzzle input as a string and
              should return the solution (string, number, or object).
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
