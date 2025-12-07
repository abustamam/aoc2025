/**
 * Solver for Day 7 of Advent of Code 2025
 *
 * To use this solver:
 * 1. Implement the solve function below
 * 2. The function receives the puzzle input as a string
 * 3. Return the solution (can be a string, number, or object)
 */

function findEmitter(lines: string[]): { row: number; col: number } {
  for (let row = 0; row < lines.length; row++) {
    const col = lines[row].indexOf('S')
    if (col !== -1) {
      return { row, col }
    }
  }
  throw new Error('No emitter "S" found in input')
}

function countSplits(lines: string[], startRow: number, startCol: number): number {
  let splitCount = 0
  let activeBeams = new Set<number>([startCol])

  for (let row = startRow; row < lines.length && activeBeams.size > 0; row++) {
    const line = lines[row]
    const nextBeams = new Set<number>()

    for (const col of activeBeams) {
      if (col < 0 || col >= line.length) continue
      const cell = line[col]

      if (cell === '^') {
        splitCount++
        if (col - 1 >= 0) nextBeams.add(col - 1)
        if (col + 1 < line.length) nextBeams.add(col + 1)
      } else {
        nextBeams.add(col)
      }
    }

    activeBeams = nextBeams
  }

  return splitCount
}

function countQuantumTimelines(
  lines: string[],
  startRow: number,
  startCol: number,
): bigint {
  let activeTimelines = new Map<number, bigint>([[startCol, 1n]])

  for (
    let row = startRow;
    row < lines.length && activeTimelines.size > 0;
    row++
  ) {
    const line = lines[row]
    const nextTimelines = new Map<number, bigint>()

    for (const [col, count] of activeTimelines) {
      if (col < 0 || col >= line.length) continue
      const cell = line[col]

      if (cell === '^') {
        if (col - 1 >= 0) {
          nextTimelines.set(col - 1, (nextTimelines.get(col - 1) ?? 0n) + count)
        }
        if (col + 1 < line.length) {
          nextTimelines.set(col + 1, (nextTimelines.get(col + 1) ?? 0n) + count)
        }
      } else {
        nextTimelines.set(col, (nextTimelines.get(col) ?? 0n) + count)
      }
    }

    activeTimelines = nextTimelines
  }

  let totalTimelines = 0n
  for (const count of activeTimelines.values()) {
    totalTimelines += count
  }
  return totalTimelines
}

export function solve(input: string): Promise<string | number | object> {
  const lines = input
    .trim()
    .split('\n')
    .filter((line) => line.length > 0)

  const { row: startRow, col: startCol } = findEmitter(lines)
  const part1 = countSplits(lines, startRow, startCol)
  const part2 = countQuantumTimelines(lines, startRow, startCol)

  return Promise.resolve({
    part1,
    part2: part2.toString(),
  })
}


