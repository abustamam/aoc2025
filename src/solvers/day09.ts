type Point = { x: number; y: number }

type CandidateInfo = {
  point: Point
  labels: Set<string>
}

type CandidateSummary = {
  point: Point
  labels: string[]
}

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

function selectExtreme(
  points: Point[],
  predicate: (point: Point) => boolean,
  isBetter: (candidate: Point, current: Point) => boolean,
): Point | null {
  let best: Point | null = null
  for (const point of points) {
    if (!predicate(point)) {
      continue
    }
    if (!best || isBetter(point, best)) {
      best = point
    }
  }
  return best
}

function inclusiveArea(a: Point, b: Point): number {
  const width = Math.abs(a.x - b.x) + 1
  const height = Math.abs(a.y - b.y) + 1
  return width * height
}

function buildCandidateSummaries(points: Point[]): CandidateSummary[] {
  if (points.length === 0) {
    return []
  }

  const minX = Math.min(...points.map((point) => point.x))
  const maxX = Math.max(...points.map((point) => point.x))
  const minY = Math.min(...points.map((point) => point.y))
  const maxY = Math.max(...points.map((point) => point.y))

  const candidateMap = new Map<string, CandidateInfo>()
  const registerCandidate = (label: string, candidate: Point | null) => {
    if (!candidate) {
      return
    }
    const key = `${candidate.x},${candidate.y}`
    const existing = candidateMap.get(key)
    if (existing) {
      existing.labels.add(label)
      return
    }
    candidateMap.set(key, {
      point: candidate,
      labels: new Set([label]),
    })
  }

  const byTop = (point: Point) => point.y === minY
  const byBottom = (point: Point) => point.y === maxY
  const byLeft = (point: Point) => point.x === minX
  const byRight = (point: Point) => point.x === maxX

  registerCandidate(
    'top-left',
    selectExtreme(points, byTop, (candidate, current) => candidate.x < current.x),
  )
  registerCandidate(
    'top-right',
    selectExtreme(points, byTop, (candidate, current) => candidate.x > current.x),
  )
  registerCandidate(
    'bottom-left',
    selectExtreme(points, byBottom, (candidate, current) => candidate.x < current.x),
  )
  registerCandidate(
    'bottom-right',
    selectExtreme(points, byBottom, (candidate, current) => candidate.x > current.x),
  )
  registerCandidate(
    'left-top',
    selectExtreme(points, byLeft, (candidate, current) => candidate.y < current.y),
  )
  registerCandidate(
    'left-bottom',
    selectExtreme(points, byLeft, (candidate, current) => candidate.y > current.y),
  )
  registerCandidate(
    'right-top',
    selectExtreme(points, byRight, (candidate, current) => candidate.y < current.y),
  )
  registerCandidate(
    'right-bottom',
    selectExtreme(points, byRight, (candidate, current) => candidate.y > current.y),
  )

  return Array.from(candidateMap.values()).map((info) => ({
    point: info.point,
    labels: Array.from(info.labels).sort(),
  }))
}

export async function solve(input: string): Promise<string | number | object> {
  const points = parsePoints(input)

  if (points.length < 2) {
    return { part1: 0, details: { candidates: [], bestPair: null } }
  }

  const candidates = buildCandidateSummaries(points)

  let maxArea = 0
  let bestPair:
    | {
        first: CandidateSummary
        second: CandidateSummary
      }
    | null = null

  for (let i = 0; i < candidates.length; i++) {
    for (let j = i + 1; j < candidates.length; j++) {
      const area = inclusiveArea(candidates[i].point, candidates[j].point)
      if (area > maxArea) {
        maxArea = area
        bestPair = {
          first: candidates[i],
          second: candidates[j],
        }
      }
    }
  }

  return {
    part1: maxArea,
    details: {
      candidates: candidates.map((candidate) => ({
        point: candidate.point,
        labels: candidate.labels,
      })),
      bestPair: bestPair
        ? {
            area: maxArea,
            first: {
              point: bestPair.first.point,
              labels: bestPair.first.labels,
            },
            second: {
              point: bestPair.second.point,
              labels: bestPair.second.labels,
            },
          }
        : null,
    },
  }
}
