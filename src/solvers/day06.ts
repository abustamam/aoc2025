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

type Grid = Array<string>

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

function extractRowOperands(
  paddedGrid: Grid,
  blockStart: number,
  blockEnd: number,
  operationRowIndex: number,
): Array<bigint> {
  const operands: Array<bigint> = []
  for (let rowIdx = 0; rowIdx < operationRowIndex; rowIdx++) {
    const chunk = paddedGrid[rowIdx].slice(blockStart, blockEnd).trim()
    if (chunk.length === 0) {
      continue
    }
    operands.push(BigInt(chunk))
  }
  return operands
}

function extractColumnOperands(
  paddedGrid: Grid,
  blockStart: number,
  blockEnd: number,
  operationRowIndex: number,
): Array<bigint> {
  const operands: Array<bigint> = []

  // Read columns right-to-left as specified in part 2.
  for (let colIdx = blockEnd - 1; colIdx >= blockStart; colIdx--) {
    let digits = ''
    for (let rowIdx = 0; rowIdx < operationRowIndex; rowIdx++) {
      const char = paddedGrid[rowIdx][colIdx] ?? ' '
      if (char >= '0' && char <= '9') {
        digits += char
      }
    }
    if (digits.length > 0) {
      operands.push(BigInt(digits))
    }
  }

  return operands
}

function applyOperator(operatorChar: Operator, operands: Array<bigint>): bigint {
  if (operands.length === 0) {
    throw new Error('Encountered problem without operands')
  }

  if (operatorChar === '+') {
    return operands.reduce((sum, value) => sum + value, 0n)
  }

  return operands.reduce((product, value) => product * value, 1n)
}

export function solve(input: string): Promise<string | number | object> {
  const lines = normalizeInput(input)
  if (lines.length === 0) {
    return Promise.resolve({
      part1: 0,
      part2: 0,
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
  let grandTotalPart1 = 0n
  let grandTotalPart2 = 0n

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

    const operatorChar = invertedGrid
      .slice(blockStart, blockEnd)
      .map((column) => column[operationRowIndex])
      .find((char): char is Operator => char === '+' || char === '*')

    if (!operatorChar) {
      throw new Error(
        `Missing operator for problem spanning columns ${blockStart}-${blockEnd}`,
      )
    }

    const operandsPart1 = extractRowOperands(
      paddedGrid,
      blockStart,
      blockEnd,
      operationRowIndex,
    )
    const operandsPart2 = extractColumnOperands(
      paddedGrid,
      blockStart,
      blockEnd,
      operationRowIndex,
    )

    if (operandsPart1.length === 0 || operandsPart2.length === 0) {
      throw new Error(
        `Problem spanning columns ${blockStart}-${blockEnd} is missing operands`,
      )
    }

    grandTotalPart1 += applyOperator(operatorChar, operandsPart1)
    grandTotalPart2 += applyOperator(operatorChar, operandsPart2)
  }

  return Promise.resolve({
    part1: formatResult(grandTotalPart1),
    part2: formatResult(grandTotalPart2),
  })
}
