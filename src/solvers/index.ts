/**
 * Solver registry
 *
 * To add a new solver:
 * 1. Create src/solvers/day##.ts with a solve function
 * 2. Import it here and add it to the solvers object
 */

import * as day01 from './day01'
import * as day02 from './day02'

// Add your solvers here as you create them
export const solvers: Record<
  string,
  { solve: (input: string) => Promise<string | number | object> }
> = {
  '01': day01,
  '02': day02,
  // Add more solvers here:
  // '03': day03,
  // etc.
}

export function getSolver(
  day: string,
): { solve: (input: string) => Promise<string | number | object> } | undefined {
  const dayPadded = day.padStart(2, '0')
  return solvers[dayPadded]
}
