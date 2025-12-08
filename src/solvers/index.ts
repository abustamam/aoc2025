/**
 * Solver registry
 *
 * To add a new solver:
 * 1. Create src/solvers/day##.ts with a solve function
 * 2. Import it here and add it to the solvers object
 */

import * as day01 from './day01'
import * as day02 from './day02'
import * as day03 from './day03'
import * as day04 from './day04'
import * as day05 from './day05'
import * as day06 from './day06'
import * as day07 from './day07'
import * as day08 from './day08'
import * as day09 from './day09'
import * as day10 from './day10'
import * as day11 from './day11'
import * as day12 from './day12'

// Add your solvers here as you create them
export const solvers: Record<
  string,
  { solve: (input: string) => Promise<string | number | object> }
> = {
  '01': day01,
  '02': day02,
  '03': day03,
  '04': day04,
  '05': day05,
  '06': day06,
  '07': day07,
  '08': day08,
  '09': day09,
  '10': day10,
  '11': day11,
  '12': day12,
}

export function getSolver(
  day: string,
): { solve: (input: string) => Promise<string | number | object> } | undefined {
  const dayPadded = day.padStart(2, '0')
  return solvers[dayPadded]
}
