/**
 * Solver for Day 3 of Advent of Code 2025
 *
 * To use this solver:
 * 1. Implement the solve function below
 * 2. The function receives the puzzle input as a string
 * 3. Return the solution (can be a string, number, or object)
 */

const getJoltagePt1 = (numbers: string): number => {
  const numbersArray = numbers.split('')
  const sortedNumbers = numbersArray.sort((a, b) => b.localeCompare(a))
  const firstTwo = sortedNumbers.slice(0, 2)
  console.log(firstTwo)
  const result = parseInt(firstTwo.join(''))
  if (isNaN(result)) {
    return 0
  }
  return result
}

export function solve(input: string): Promise<string | number | object> {
  const lines = input.split('\n')
  let totalJoltagePt1 = 0
  for (const line of lines) {
    const joltage = getJoltagePt1(line)
    totalJoltagePt1 += joltage
  }

  return Promise.resolve({
    part1: totalJoltagePt1,
    part2: 0,
  })
}
