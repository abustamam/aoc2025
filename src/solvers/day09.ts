type Point = { x: number; y: number }

function parsePoints(input: string): Point[] {
  if (!input.trim()) {
    return []
  }

  return input
    .trim()
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line, idx) => {
      const [xStr, yStr] = line.split(',').map((value) => value.trim())
      if (xStr === undefined || yStr === undefined) {
        throw new Error(`Invalid coordinate on line ${idx + 1}: "${line}"`)
      }
      const x = Number(xStr)
      const y = Number(yStr)
      if (Number.isNaN(x) || Number.isNaN(y)) {
        throw new Error(`Invalid numeric value on line ${idx + 1}: "${line}"`)
      }
      return { x, y }
    })
}

function inclusiveArea(a: Point, b: Point): number {
  const width = Math.abs(a.x - b.x) + 1
  const height = Math.abs(a.y - b.y) + 1
  return width * height
}

function findLargestRectangle(points: Point[]): {
  area: number
  pair: [Point, Point] | null
  comparisons: number
} {
  let bestArea = 0
  let bestPair: [Point, Point] | null = null
  let comparisons = 0

  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const area = inclusiveArea(points[i], points[j])
      comparisons += 1
      if (area > bestArea) {
        bestArea = area
        bestPair = [points[i], points[j]]
      }
    }
  }

  return { area: bestArea, pair: bestPair, comparisons }
}

export async function solve(input: string): Promise<string | number | object> {
  const points = parsePoints(input)

  if (points.length < 2) {
    return {
      part1: 0,
      details: {
        points: points.length,
        comparisons: 0,
        bestPair: null,
      },
    }
  }

  const { area, pair, comparisons } = findLargestRectangle(points)

  return {
    part1: area,
    details: {
      points: points.length,
      comparisons,
      bestPair: pair
        ? {
            area,
            first: pair[0],
            second: pair[1],
          }
        : null,
    },
  }
}
