/**
 * Solver for Day 3 of Advent of Code 2025
 *
 * To use this solver:
 * 1. Implement the solve function below
 * 2. The function receives the puzzle input as a string
 * 3. Return the solution (can be a string, number, or object)
 */

const getJoltage = (numbers: string, numDigits: number): number => {
  const digits = numbers.split('').map(Number)
  const n = digits.length

  // dp[i][j] = maximum number we can form using j digits starting from position i
  // Use a Map for memoization to avoid creating a large 2D array
  const memo = new Map<string, number>()

  const dp = (start: number, remaining: number): number => {
    // Base case: no digits left to select
    if (remaining === 0) return 0

    // Not enough digits remaining
    if (n - start < remaining) return -1

    const key = `${start},${remaining}`
    if (memo.has(key)) {
      return memo.get(key)!
    }

    let maxNum = -1

    // Try selecting each possible digit at position >= start
    // We need to leave at least (remaining - 1) digits after the selected one
    for (let i = start; i <= n - remaining; i++) {
      const rest = dp(i + 1, remaining - 1)
      if (rest !== -1) {
        // Form the number: current digit * 10^(remaining-1) + rest
        const power = Math.pow(10, remaining - 1)
        const num = digits[i] * power + rest
        maxNum = Math.max(maxNum, num)
      }
    }

    memo.set(key, maxNum)
    return maxNum
  }

  return dp(0, numDigits)
}

export function solve(input: string): Promise<string | number | object> {
  const lines = input.split('\n')
  let totalJoltagePt1 = 0
  let totalJoltagePt2 = 0

  for (const line of lines) {
    if (line.length < 2) {
      continue
    }
    const joltagePt1 = getJoltage(line, 2)
    totalJoltagePt1 += joltagePt1

    if (line.length >= 12) {
      const joltagePt2 = getJoltage(line, 12)
      totalJoltagePt2 += joltagePt2
    }
  }

  return Promise.resolve({
    part1: totalJoltagePt1,
    part2: totalJoltagePt2,
  })
}
