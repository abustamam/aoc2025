/**
 * Solver for Day 1 of Advent of Code 2025
 *
 * To use this solver:
 * 1. Implement the solve function below
 * 2. The function receives the puzzle input as a string
 * 3. Return the solution (can be a string, number, or object)
 */

function modFloor0(x: number): number {
  // Returns x mod 100, but always >= 0, so modFloor0(-1) == 99, modFloor0(-99) == 1, etc
  // For -102: (-102 % 100) = -2, (-2 + 100) = 98, which is correct.
  return ((x % 100) + 100) % 100
}

function parseLine(line: string): { direction: string; distance: number } {
  const [direction, ...distanceStr] = line.split('')
  const distance = parseInt(distanceStr.join(''))
  return { direction: direction as 'R' | 'L', distance }
}

export function solve(input: string): Promise<string | number | object> {
  // Example implementation - replace with your actual solution
  const lines = input.trim().split('\n')

  // Process the input and solve the puzzle
  // For Day 1, you might need to parse rotations like "R48", "L2", etc.

  let countPt1 = 0
  let countPt2 = 0
  let dial = 50

  for (const line of lines) {
    const { direction, distance } = parseLine(line)

    // For part 2, we need to check each click during the rotation
    // Count how many times we pass through 0 during this rotation
    for (let i = 1; i <= distance; i++) {
      if (direction === 'R') {
        dial = (dial + 1) % 100
      } else {
        dial = modFloor0(dial - 1)
      }
      if (dial === 0) {
        countPt2++
      }
    }

    // Part 1: count if dial ends at 0 after the rotation
    if (dial === 0) {
      countPt1++
    }
  }

  // Return your answer
  return Promise.resolve({
    part1: countPt1,
    part2: countPt2,
  })
}
