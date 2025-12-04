/**
 * Solver for Day 4 of Advent of Code 2025
 *
 * To use this solver:
 * 1. Implement the solve function below
 * 2. The function receives the puzzle input as a string
 * 3. Return the solution (can be a string, number, or object)
 */

const getSurroundingRolls = (
  grid: Array<Array<string>>,
  row: number,
  col: number,
): number => {
  // 8 directions: up, down, left, right, and 4 diagonals
  const directions = [
    [-1, -1],
    [-1, 0],
    [-1, 1], // top row
    [0, -1],
    [0, 1], // middle row (skip center)
    [1, -1],
    [1, 0],
    [1, 1], // bottom row
  ]

  let surroundingRolls = 0
  for (const [dr, dc] of directions) {
    const newRow = row + dr
    const newCol = col + dc

    // Check bounds
    if (
      newRow >= 0 &&
      newRow < grid.length &&
      newCol >= 0 &&
      newCol < grid[0].length &&
      grid[newRow][newCol] === '@'
    ) {
      surroundingRolls++
    }
  }
  return surroundingRolls
}

export function solve(input: string): Promise<string | number | object> {
  const grid = input.split('\n').map((line) => line.split(''))
  const rows = grid.length
  const cols = grid[0].length
  let rollsPt1 = 0

  for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
    const row = grid[rowIndex]
    for (let colIndex = 0; colIndex < cols; colIndex++) {
      const cell = row[colIndex]
      if (cell === '@') {
        const surroundingRolls = getSurroundingRolls(grid, rowIndex, colIndex)
        if (surroundingRolls < 4) {
          rollsPt1++
          grid[rowIndex][colIndex] = 'x'
        }
      }
    }
  }
  // Part 2: Iteratively remove rolls until no more can be removed
  // Part 2 total includes part 1, so start with rollsPt1
  let totalRollsRemoved = rollsPt1
  let rollsRemovedThisIteration = 1 // Start with 1 to enter the loop

  while (rollsRemovedThisIteration > 0) {
    rollsRemovedThisIteration = 0

    for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
      const row = grid[rowIndex]
      for (let colIndex = 0; colIndex < cols; colIndex++) {
        const cell = row[colIndex]
        if (cell === '@') {
          const surroundingRolls = getSurroundingRolls(grid, rowIndex, colIndex)
          if (surroundingRolls < 4) {
            rollsRemovedThisIteration++
            totalRollsRemoved++
            grid[rowIndex][colIndex] = 'x'
          }
        }
      }
    }
  }

  return Promise.resolve({
    part1: rollsPt1,
    part2: totalRollsRemoved,
  })
}
