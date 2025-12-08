/**
 * Solver for Day 8 of Advent of Code 2025
 *
 * The puzzle asks us to repeatedly connect the pairs of junction boxes that are
 * closest to each other (based on Euclidean distance) and then examine the
 * resulting electrical circuits. After connecting the 1000 closest pairs, we
 * must multiply together the sizes of the three largest circuits.
 */

type Point3D = { x: number; y: number; z: number }

type JunctionInfo = {
  index: number
  point: Point3D
  circuitId: number
  closestIndex: number | null
  closestDistance: number
}

type DistancePair = { i: number; j: number; distance: number }

type CircuitSummary = { circuitId: number; members: number[] }

class CircuitManager {
  private parent: number[]
  private size: number[]
  private circuits: Map<number, Set<number>>

  constructor(
    private readonly count: number,
    private readonly junctions: Map<number, JunctionInfo>,
  ) {
    this.parent = Array.from({ length: count }, (_, index) => index)
    this.size = Array.from({ length: count }, () => 1)
    this.circuits = new Map()

    for (let index = 0; index < count; index++) {
      this.circuits.set(index, new Set([index]))
    }
  }

  private find(node: number): number {
    if (this.parent[node] !== node) {
      this.parent[node] = this.find(this.parent[node])
    }
    return this.parent[node]
  }

  union(a: number, b: number): number {
    let rootA = this.find(a)
    let rootB = this.find(b)

    if (rootA === rootB) {
      return rootA
    }

    if (this.size[rootA] < this.size[rootB]) {
      ;[rootA, rootB] = [rootB, rootA]
    }

    this.parent[rootB] = rootA
    this.size[rootA] += this.size[rootB]

    const rootACircuit = this.circuits.get(rootA)
    const rootBCircuit = this.circuits.get(rootB)

    if (!rootACircuit || !rootBCircuit) {
      throw new Error('Circuit data missing during union operation')
    }

    for (const junctionIndex of rootBCircuit) {
      rootACircuit.add(junctionIndex)
      const junctionInfo = this.junctions.get(junctionIndex)
      if (junctionInfo) {
        junctionInfo.circuitId = rootA
      }
    }

    this.circuits.delete(rootB)
    return rootA
  }

  getCircuitSizes(): number[] {
    return Array.from(this.circuits.values(), (members) => members.size)
  }

  getCircuitSummaries(): CircuitSummary[] {
    return Array.from(this.circuits.entries()).map(([circuitId, members]) => ({
      circuitId,
      members: [...members].sort((a, b) => a - b),
    }))
  }
}

const DEFAULT_CONNECTIONS = 1000

function getConnectionsTarget(): number {
  const override = process.env.AOC_DAY08_CONNECTIONS
  if (!override) return DEFAULT_CONNECTIONS
  const parsed = Number(override)
  if (!Number.isFinite(parsed)) {
    return DEFAULT_CONNECTIONS
  }
  return Math.max(0, Math.floor(parsed))
}

function parsePoints(input: string): Point3D[] {
  return input
    .trim()
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line, idx) => {
      const [x, y, z] = line.split(',').map((value) => Number(value.trim()))
      if ([x, y, z].some((coord) => Number.isNaN(coord))) {
        throw new Error(`Invalid coordinate on line ${idx + 1}: "${line}"`)
      }
      return { x, y, z }
    })
}

function distance(a: Point3D, b: Point3D): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)
}

function buildJunctionMap(points: Point3D[]): Map<number, JunctionInfo> {
  const junctions = new Map<number, JunctionInfo>()
  points.forEach((point, index) => {
    junctions.set(index, {
      index,
      point,
      circuitId: index,
      closestIndex: null,
      closestDistance: Number.POSITIVE_INFINITY,
    })
  })
  return junctions
}

function buildDistancePairs(
  points: Point3D[],
  junctions: Map<number, JunctionInfo>,
): DistancePair[] {
  const pairs: DistancePair[] = []

  for (let i = 0; i < points.length; i++) {
    const pointA = points[i]
    for (let j = i + 1; j < points.length; j++) {
      const pointB = points[j]
      const dist = distance(pointA, pointB)
      pairs.push({ i, j, distance: dist })

      const junctionA = junctions.get(i)
      const junctionB = junctions.get(j)
      if (junctionA && dist < junctionA.closestDistance) {
        junctionA.closestDistance = dist
        junctionA.closestIndex = j
      }
      if (junctionB && dist < junctionB.closestDistance) {
        junctionB.closestDistance = dist
        junctionB.closestIndex = i
      }
    }
  }

  return pairs
}

function multiplyTopThree(sizes: number[]): number {
  if (sizes.length < 3) {
    throw new Error(
      'Need at least three circuits to compute the requested product',
    )
  }

  const [first, second, third] = sizes
    .slice()
    .sort((a, b) => b - a)
    .slice(0, 3)

  return first * second * third
}

function asRecord<T>(
  entries: Array<[number, T]>,
): Record<number, T> | Record<string, T> {
  return Object.fromEntries(entries)
}

export function solve(input: string): Promise<string | number | object> {
  const points = parsePoints(input)

  if (points.length < 2) {
    return Promise.resolve({
      part1: 0,
      part2: {
        circuits: {},
        junctions: {},
      },
    })
  }

  const junctions = buildJunctionMap(points)
  const pairs = buildDistancePairs(points, junctions).sort(
    (a, b) => a.distance - b.distance,
  )

  const circuitManager = new CircuitManager(points.length, junctions)
  const connectionsTarget = getConnectionsTarget()
  const connectionsToProcess = Math.min(connectionsTarget, pairs.length)

  for (let idx = 0; idx < connectionsToProcess; idx++) {
    const { i, j } = pairs[idx]
    circuitManager.union(i, j)
  }

  const circuitSizes = circuitManager
    .getCircuitSizes()
    .sort((a, b) => b - a)

  const part1 = multiplyTopThree(circuitSizes)

  const circuitSummaries = circuitManager
    .getCircuitSummaries()
    .sort((a, b) => b.members.length - a.members.length)

  const circuitsRecord = asRecord(
    circuitSummaries.map(({ circuitId, members }) => [
      circuitId,
      { size: members.length, members },
    ]),
  )

  const junctionsRecord = asRecord(
    Array.from(junctions.entries()).map(([index, info]) => [
      index,
      {
        circuitId: info.circuitId,
        closestIndex: info.closestIndex,
        closestDistance:
          Number.isFinite(info.closestDistance) &&
          info.closestDistance !== Number.POSITIVE_INFINITY
            ? info.closestDistance
            : null,
      },
    ]),
  )

  return Promise.resolve({
    part1,
    part2: {
      totalCircuits: circuitSummaries.length,
      circuits: circuitsRecord,
      junctions: junctionsRecord,
    },
  })
}
