import fs from 'node:fs/promises'
import path from 'node:path'
import { getSolver } from '../src/solvers'

type Variant = 'input' | 'test'

function parseArgs(): { day: string; variant: Variant } {
  const [, , dayArg, variantArg] = process.argv

  if (!dayArg) {
    throw new Error('Usage: npm run solve -- <day> [input|test]')
  }

  const normalizedVariant =
    variantArg === 'test' || variantArg === 'input' ? variantArg : 'input'

  return { day: dayArg, variant: normalizedVariant }
}

async function loadInput(day: string, variant: Variant): Promise<string> {
  const dayPadded = day.padStart(2, '0')
  const filename = variant === 'test' ? 'test-input' : 'input'
  const inputPath = path.join(process.cwd(), 'src', 'inputs', `day${dayPadded}`, filename)
  return fs.readFile(inputPath, 'utf-8')
}

async function main() {
  const { day, variant } = parseArgs()
  const solver = getSolver(day)

  if (!solver || typeof solver.solve !== 'function') {
    throw new Error(`Solver for day ${day} is not registered`)
  }

  const input = await loadInput(day, variant)
  const result = await solver.solve(input)
  console.log(JSON.stringify(result, null, 2))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
