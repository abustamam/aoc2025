/**
 * Solver for Day 6 of Advent of Code 2025
 *
 * To use this solver:
 * 1. Implement the solve function below
 * 2. The function receives the puzzle input as a string
 * 3. Return the solution (can be a string, number, or object)
 */

type Operator = '+' | '*'

const MAX_SAFE_BIGINT = BigInt(Number.MAX_SAFE_INTEGER)

function normalizeInput(rawInput: string): string[] {
  const sanitizedLines = rawInput.replaceAll('\r', '').split('\n')

  // Drop trailing blank lines to avoid creating empty problems.
  while (
    sanitizedLines.length > 0 &&
    sanitizedLines[sanitizedLines.length - 1].trim() === ''
  ) {
    sanitizedLines.pop()
  }

  return sanitizedLines
}

function formatResult(value: bigint): number | string {
  if (value <= MAX_SAFE_BIGINT) {
    return Number(value)
  }
  return value.toString()
}

export function solve(input: string): Promise<string | number | object> {
  const lines = normalizeInput(input)
  if (lines.length === 0) {
    return Promise.resolve({
      part1: 0,
      part2: 'Not implemented yet',
    })
  }

  const width = lines.reduce((max, line) => Math.max(max, line.length), 0)
  const paddedGrid = lines.map((line) => line.padEnd(width, ' '))
  const height = paddedGrid.length
  const operationRowIndex = height - 1

  // Invert the grid so each column becomes a row. The last element in each row
  // now corresponds to the operator for that column.
  const invertedGrid: Array<Array<string>> = Array.from(
    { length: width },
    (_, colIdx) => {
      const columnChars: Array<string> = []
      for (let rowIdx = 0; rowIdx < height; rowIdx++) {
        columnChars.push(paddedGrid[rowIdx][colIdx] ?? ' ')
      }
      return columnChars
    },
  )

  const columnHasContent = invertedGrid.map((column) =>
    column.some((char) => char !== ' '),
  )

  let columnIdx = 0
  let grandTotal = 0n

  while (columnIdx < width) {
    if (!columnHasContent[columnIdx]) {
      columnIdx++
      continue
    }

    const blockStart = columnIdx
    while (columnIdx < width && columnHasContent[columnIdx]) {
      columnIdx++
    }
    const blockEnd = columnIdx

    const operands: Array<bigint> = []
    for (let rowIdx = 0; rowIdx < operationRowIndex; rowIdx++) {
      const chunk = paddedGrid[rowIdx].slice(blockStart, blockEnd).trim()
      if (chunk.length === 0) {
        continue
      }
      operands.push(BigInt(chunk))
    }

    if (operands.length === 0) {
      continue
    }

    const operatorChar = invertedGrid
      .slice(blockStart, blockEnd)
      .map((column) => column[operationRowIndex])
      .find((char): char is Operator => char === '+' || char === '*')

    if (!operatorChar) {
      throw new Error(
        `Missing operator for problem spanning columns ${blockStart}-${blockEnd}`,
      )
    }

    const problemValue =
      operatorChar === '+'
        ? operands.reduce((sum, value) => sum + value, 0n)
        : operands.reduce((product, value) => product * value, 1n)

    grandTotal += problemValue
  }

  return Promise.resolve({
    part1: formatResult(grandTotal),
    part2: 'Not implemented yet',
  })
}
