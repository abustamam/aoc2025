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
import * as day13 from './day13'
import * as day14 from './day14'
import * as day15 from './day15'
import * as day16 from './day16'
import * as day17 from './day17'
import * as day18 from './day18'
import * as day19 from './day19'
import * as day20 from './day20'
import * as day21 from './day21'
import * as day22 from './day22'
import * as day23 from './day23'
import * as day24 from './day24'

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
  '13': day13,
  '14': day14,
  '15': day15,
  '16': day16,
  '17': day17,
  '18': day18,
  '19': day19,
  '20': day20,
  '21': day21,
  '22': day22,
  '23': day23,
  '24': day24,
}

export function getSolver(
  day: string,
): { solve: (input: string) => Promise<string | number | object> } | undefined {
  const dayPadded = day.padStart(2, '0')
  return solvers[dayPadded]
}
