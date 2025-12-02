/**
 * Solver for Day 2 of Advent of Code 2025
 *
 * To use this solver:
 * 1. Implement the solve function below
 * 2. The function receives the puzzle input as a string
 * 3. Return the solution (can be a string, number, or object)
 */

const isInvalidPt1 = (number: number): boolean => {
  const numberStr = number.toString()
  const firstHalf = numberStr.slice(0, numberStr.length / 2)
  const secondHalf = numberStr.slice(numberStr.length / 2)
  if (firstHalf === secondHalf) {
    return true
  }
  return false
}

const isInvalidPt2 = (number: number): boolean => {
  const numberStr = number.toString()
  const len = numberStr.length
  const half = Math.floor(len / 2)
  for (let idx = 1; idx <= half; idx++) {
    if (len % idx !== 0) {
      continue
    }
    const repeat = len / idx
    if (repeat < 2) {
      continue
    }
    const sub = numberStr.slice(0, idx)
    const repeated = sub.repeat(repeat)
    if (numberStr === repeated) {
      return true
    }
  }
  return false
}

export function solve(input: string): Promise<string | number | object> {
  const ranges = input.split(',')
  let countPt1 = 0
  let countPt2 = 0
  for (const range of ranges) {
    const [startStr, endStr] = range.split('-')
    const start = parseInt(startStr)
    const end = parseInt(endStr)
    for (let num = start; num <= end; num++) {
      if (isInvalidPt1(num)) {
        countPt1 += num
      }
      if (isInvalidPt2(num)) {
        countPt2 += num
      }
    }
  }
  return Promise.resolve({
    part1: countPt1,
    part2: countPt2,
  })
}
