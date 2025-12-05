/**
 * Solver for Day 4 of Advent of Code 2025
 *
 * To use this solver:
 * 1. Implement the solve function below
 * 2. The function receives the puzzle input as a string
 * 3. Return the solution (can be a string, number, or object)
 */

function mergeRanges(ranges: Array<[number, number]>): Array<[number, number]> {
  if (ranges.length === 0) {
    return []
  }

  // Sort by start position
  const sortedRanges = [...ranges].sort((a, b) => a[0] - b[0])
  const merged: Array<[number, number]> = [sortedRanges[0]]

  for (let i = 1; i < sortedRanges.length; i++) {
    const [start, end] = sortedRanges[i]
    const lastIdx = merged.length - 1
    const [lastStart, lastEnd] = merged[lastIdx]

    // If current range overlaps or is adjacent to last range
    if (start <= lastEnd + 1) {
      // Extend the last range if needed
      merged[lastIdx] = [lastStart, Math.max(lastEnd, end)]
    } else {
      // No overlap, add as new range
      merged.push([start, end])
    }
  }

  return merged
}

function binarySearchIsFresh(
  id: number,
  mergedRanges: Array<[number, number]>,
): boolean {
  let left = 0
  let right = mergedRanges.length - 1
  let result = -1

  // Find the rightmost range that starts at or before id
  while (left <= right) {
    const mid = Math.floor((left + right) / 2)
    if (mergedRanges[mid][0] <= id) {
      result = mid
      left = mid + 1
    } else {
      right = mid - 1
    }
  }

  if (result >= 0) {
    const [start, end] = mergedRanges[result]
    return start <= id && id <= end
  }
  return false
}

function countFreshIngredientsFast(
  ranges: Array<[number, number]>,
  ingredientIds: Array<number>,
): number {
  const merged = mergeRanges(ranges)
  return ingredientIds.filter((id) => binarySearchIsFresh(id, merged)).length
}

export function solve(input: string): Promise<string | number | object> {
  const [rangesStr, numbersStr] = input.split('\n\n')
  let totalPt2 = 0

  // Filter out blank lines when parsing ranges
  const ranges = rangesStr
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line) => {
      const [start, end] = line.split('-').map(Number)
      return [start, end] as [number, number]
    })
    .sort((a, b) => a[0] - b[0])

  // Filter out blank lines when parsing numbers
  const numbers = numbersStr
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map(Number)

  const freshCount = countFreshIngredientsFast(ranges, numbers)

  return Promise.resolve({
    part1: freshCount,
    part2: '',
  })
}
