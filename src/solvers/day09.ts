type Point = { x: number; y: number }

type Edge = {
  x1: number
  y1: number
  x2: number
  y2: number
  vertical: boolean
  minX: number
  maxX: number
  minY: number
  maxY: number
}

type Rectangle = {
  area: number
  first: Point
  second: Point
}

const EPSILON = 1e-9

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

function buildEdges(points: Point[]): Edge[] {
  if (points.length < 2) {
    return []
  }
  const edges: Edge[] = []
  for (let i = 0; i < points.length; i++) {
    const a = points[i]
    const b = points[(i + 1) % points.length]
    if (a.x !== b.x && a.y !== b.y) {
      throw new Error(
        `Invalid polygon: consecutive points are not aligned (${a.x},${a.y}) -> (${b.x},${b.y})`,
      )
    }
    const vertical = a.x === b.x
    const edge: Edge = {
      x1: a.x,
      y1: a.y,
      x2: b.x,
      y2: b.y,
      vertical,
      minX: Math.min(a.x, b.x),
      maxX: Math.max(a.x, b.x),
      minY: Math.min(a.y, b.y),
      maxY: Math.max(a.y, b.y),
    }
    edges.push(edge)
  }
  return edges
}

function isPointOnSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): boolean {
  if (Math.abs(ax - bx) < EPSILON) {
    if (Math.abs(px - ax) > EPSILON) {
      return false
    }
    return py + EPSILON >= Math.min(ay, by) && py - EPSILON <= Math.max(ay, by)
  }
  if (Math.abs(ay - by) < EPSILON) {
    if (Math.abs(py - ay) > EPSILON) {
      return false
    }
    return px + EPSILON >= Math.min(ax, bx) && px - EPSILON <= Math.max(ax, bx)
  }
  return false
}

function pointInPolygon(point: Point, polygon: Point[]): boolean {
  const { x: px, y: py } = point
  let inside = false

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x
    const yi = polygon[i].y
    const xj = polygon[j].x
    const yj = polygon[j].y

    if (isPointOnSegment(px, py, xi, yi, xj, yj)) {
      return true
    }

    if (Math.abs(yj - yi) < EPSILON) {
      continue
    }

    const intersects =
      (yi > py) !== (yj > py) &&
      px <
        ((xj - xi) * (py - yi)) / (yj - yi + Number.EPSILON) + xi + EPSILON

    if (intersects) {
      inside = !inside
    }
  }

  return inside
}

function rectangleIntersectsBoundary(
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
  edges: Edge[],
): boolean {
  for (const edge of edges) {
    if (edge.vertical) {
      if (edge.x1 <= xMin || edge.x1 >= xMax) {
        continue
      }
      const overlap =
        Math.min(edge.maxY, yMax) - Math.max(edge.minY, yMin)
      if (overlap > 0) {
        return true
      }
    } else {
      if (edge.y1 <= yMin || edge.y1 >= yMax) {
        continue
      }
      const overlap =
        Math.min(edge.maxX, xMax) - Math.max(edge.minX, xMin)
      if (overlap > 0) {
        return true
      }
    }
  }
  return false
}

function isRectangleValid(
  a: Point,
  b: Point,
  polygon: Point[],
  edges: Edge[],
): boolean {
  const xMin = Math.min(a.x, b.x)
  const xMax = Math.max(a.x, b.x)
  const yMin = Math.min(a.y, b.y)
  const yMax = Math.max(a.y, b.y)

  if (xMin === xMax && yMin === yMax) {
    return false
  }

  if (rectangleIntersectsBoundary(xMin, xMax, yMin, yMax, edges)) {
    return false
  }

  const sampleX = xMin === xMax ? xMin : (xMin + xMax) / 2
  const sampleY = yMin === yMax ? yMin : (yMin + yMax) / 2

  return pointInPolygon({ x: sampleX, y: sampleY }, polygon)
}

function formatRectangle(rect: Rectangle | null) {
  if (!rect) {
    return null
  }
  return {
    area: rect.area,
    first: rect.first,
    second: rect.second,
  }
}

export async function solve(input: string): Promise<string | number | object> {
  const points = parsePoints(input)

  if (points.length < 2) {
    return {
      part1: 0,
      part2: 0,
      details: {
        totalPoints: points.length,
        part1Best: null,
        part2Best: null,
      },
    }
  }

  const edges = buildEdges(points)
  let bestAny: Rectangle | null = null
  let bestRestricted: Rectangle | null = null
  let comparisons = 0
  let validations = 0

  for (let i = 0; i < points.length; i++) {
    const pointA = points[i]
    for (let j = i + 1; j < points.length; j++) {
      const pointB = points[j]
      const area = inclusiveArea(pointA, pointB)
      comparisons += 1

      if (!bestAny || area > bestAny.area) {
        bestAny = { area, first: pointA, second: pointB }
      }

      if (bestRestricted && area <= bestRestricted.area) {
        continue
      }

      validations += 1
      if (isRectangleValid(pointA, pointB, points, edges)) {
        bestRestricted = { area, first: pointA, second: pointB }
      }
    }
  }

  return {
    part1: bestAny?.area ?? 0,
    part2: bestRestricted?.area ?? 0,
    details: {
      totalPoints: points.length,
      comparisons,
      validationsAttempted: validations,
      part1Best: formatRectangle(bestAny),
      part2Best: formatRectangle(bestRestricted),
    },
  }
}
