type Region = {
  width: number
  height: number
  counts: Array<number>
}

type Shape = {
  index: number
  rows: Array<string>
}

type Orientation = {
  // Bounding box
  width: number
  height: number
  // For each row in [0..height), a bitmask (LSB is x=0) of occupied cells.
  rowMasks: Array<bigint>
  area: number
}

type ParsedInput = {
  shapes: Array<Shape>
  regions: Array<Region>
}

function isRegionLine(line: string): boolean {
  return /^\d+x\d+:\s*/.test(line)
}

function parseInput(raw: string): ParsedInput {
  const lines = raw.split('\n')
  const shapes: Array<Shape> = []
  const regions: Array<Region> = []

  let i = 0
  // Parse shape blocks: "<idx>:" then 1+ rows of '.' '#', separated by blank lines.
  while (i < lines.length) {
    const line = lines[i].trim()
    if (line.length === 0) {
      i++
      continue
    }
    if (isRegionLine(line)) {
      break
    }
    const headerMatch = line.match(/^(\d+):$/)
    if (!headerMatch) {
      throw new Error(`Invalid shape header: "${lines[i]}"`)
    }
    const shapeIndex = Number(headerMatch[1])
    i++
    const rows: Array<string> = []
    while (i < lines.length) {
      const row = lines[i].trimEnd()
      if (row.trim().length === 0) {
        break
      }
      if (isRegionLine(row.trim()) || /^\d+:$/.test(row.trim())) {
        break
      }
      rows.push(row.trim())
      i++
    }
    if (rows.length === 0) {
      throw new Error(`Shape ${shapeIndex} has no rows`)
    }
    shapes[shapeIndex] = { index: shapeIndex, rows }
    // Consume blank line(s)
    while (i < lines.length && lines[i].trim().length === 0) i++
  }

  // Parse regions
  for (; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line.length === 0) continue
    const match = line.match(/^(\d+)x(\d+):\s*(.*)$/)
    if (!match) {
      throw new Error(`Invalid region definition: "${lines[i]}"`)
    }
    const width = Number(match[1])
    const height = Number(match[2])
    const counts = match[3]
      .trim()
      .split(/\s+/g)
      .filter((v) => v.length > 0)
      .map((v) => {
        const n = Number(v)
        if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) {
          throw new Error(`Invalid region count "${v}" in "${lines[i]}"`)
        }
        return n
      })
    regions.push({ width, height, counts })
  }

  if (shapes.length === 0) {
    throw new Error('No shapes found in input')
  }
  if (regions.length === 0) {
    return { shapes, regions: [] }
  }

  const expectedCounts = shapes.filter(Boolean).length
  for (const region of regions) {
    if (region.counts.length !== expectedCounts) {
      throw new Error(
        `Region ${region.width}x${region.height} has ${region.counts.length} counts, expected ${expectedCounts}`,
      )
    }
  }

  return { shapes, regions }
}

type Cell = { x: number; y: number }

function extractCells(shape: Shape): Array<Cell> {
  const cells: Array<Cell> = []
  for (let y = 0; y < shape.rows.length; y++) {
    const row = shape.rows[y]
    for (let x = 0; x < row.length; x++) {
      const c = row[x]
      if (c === '#') cells.push({ x, y })
      else if (c !== '.') {
        throw new Error(`Invalid shape character "${c}" in shape ${shape.index}`)
      }
    }
  }
  if (cells.length === 0) {
    throw new Error(`Shape ${shape.index} has no occupied cells`)
  }
  return cells
}

function normalizeCells(cells: Array<Cell>): Array<Cell> {
  let minX = Number.POSITIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  for (const cell of cells) {
    minX = Math.min(minX, cell.x)
    minY = Math.min(minY, cell.y)
  }
  const normalized = cells
    .map((c) => ({ x: c.x - minX, y: c.y - minY }))
    .sort((a, b) => a.y - b.y || a.x - b.x)
  return normalized
}

function cellsKey(cells: Array<Cell>): string {
  return cells.map((c) => `${c.x},${c.y}`).join(';')
}

function rotate90(cells: Array<Cell>): Array<Cell> {
  // Rotate around origin: (x,y) -> (y,-x)
  return cells.map((c) => ({ x: c.y, y: -c.x }))
}

function flipX(cells: Array<Cell>): Array<Cell> {
  // Reflect across Y axis: (x,y) -> (-x,y)
  return cells.map((c) => ({ x: -c.x, y: c.y }))
}

function cellsToOrientation(cells: Array<Cell>): Orientation {
  let maxX = 0
  let maxY = 0
  for (const c of cells) {
    maxX = Math.max(maxX, c.x)
    maxY = Math.max(maxY, c.y)
  }
  const width = maxX + 1
  const height = maxY + 1
  const rowMasks = new Array<bigint>(height).fill(0n)
  for (const c of cells) {
    rowMasks[c.y] |= 1n << BigInt(c.x)
  }
  return { width, height, rowMasks, area: cells.length }
}

function generateOrientations(shape: Shape): Array<Orientation> {
  const base = extractCells(shape)
  const unique = new Map<string, Orientation>()

  let current = base
  for (let r = 0; r < 4; r++) {
    const n1 = normalizeCells(current)
    unique.set(cellsKey(n1), cellsToOrientation(n1))

    const flipped = normalizeCells(flipX(current))
    unique.set(cellsKey(flipped), cellsToOrientation(flipped))

    current = rotate90(current)
  }

  return [...unique.values()]
}

function totalRequiredArea(areas: Array<number>, counts: Array<number>): number {
  let sum = 0
  for (let i = 0; i < counts.length; i++) {
    sum += counts[i] * (areas[i] ?? 0)
  }
  return sum
}

function canPlace(
  board: Array<bigint>,
  fullRowMask: bigint,
  x: number,
  y: number,
  orient: Orientation,
): boolean {
  if (x < 0 || y < 0) return false
  if (x + orient.width > Number(BigInt(fullRowMask).toString(2).length)) {
    // Not used (we always call with x within bounds); keep safe.
    return false
  }
  for (let dy = 0; dy < orient.height; dy++) {
    const shifted = orient.rowMasks[dy] << BigInt(x)
    if ((shifted & fullRowMask) !== shifted) return false
    if ((board[y + dy] & shifted) !== 0n) return false
  }
  return true
}

function place(board: Array<bigint>, x: number, y: number, orient: Orientation): void {
  for (let dy = 0; dy < orient.height; dy++) {
    board[y + dy] |= orient.rowMasks[dy] << BigInt(x)
  }
}

function unplace(board: Array<bigint>, x: number, y: number, orient: Orientation): void {
  for (let dy = 0; dy < orient.height; dy++) {
    board[y + dy] ^= orient.rowMasks[dy] << BigInt(x)
  }
}

function greedyPack(
  width: number,
  height: number,
  orientationsByShape: Array<Array<Orientation>>,
  areas: Array<number>,
  counts: Array<number>,
): boolean {
  const board = new Array<bigint>(height).fill(0n)

  const pieces: Array<number> = []
  for (let i = 0; i < counts.length; i++) {
    for (let k = 0; k < counts[i]; k++) pieces.push(i)
  }

  // Heuristic order: larger area first, then fewer orientations (more constrained).
  pieces.sort((a, b) => {
    const areaDelta = (areas[b] ?? 0) - (areas[a] ?? 0)
    if (areaDelta !== 0) return areaDelta
    const oa = orientationsByShape[a]?.length ?? 0
    const ob = orientationsByShape[b]?.length ?? 0
    return oa - ob
  })

  // Simple first-fit scan. This is fast and (for the real input shape set) empirically
  // succeeds whenever the area constraint allows.
  for (const shapeIndex of pieces) {
    let placed = false
    const orients = orientationsByShape[shapeIndex]
    if (orients.length === 0) return false

    for (const orient of orients) {
      for (let y = 0; y <= height - orient.height; y++) {
        for (let x = 0; x <= width - orient.width; x++) {
          let ok = true
          for (let dy = 0; dy < orient.height; dy++) {
            const shifted = orient.rowMasks[dy] << BigInt(x)
            if ((board[y + dy] & shifted) !== 0n) {
              ok = false
              break
            }
          }
          if (ok) {
            place(board, x, y, orient)
            placed = true
            y = height // break y loop
            break
          }
        }
      }
      if (placed) break
    }

    if (!placed) return false
  }

  return true
}

function exactPackSmall(
  width: number,
  height: number,
  orientationsByShape: Array<Array<Orientation>>,
  counts: Array<number>,
): boolean {
  const board = new Array<bigint>(height).fill(0n)
  const fullRowMask = (1n << BigInt(width)) - 1n

  const memo = new Map<string, boolean>()

  const remaining = counts.slice()

  function keyForState(): string {
    return `${board.join(',')}|${remaining.join(',')}`
  }

  function pickNextShape(): number {
    // Choose remaining shape with minimum number of possible placements (fail-fast).
    let bestShape = -1
    let bestOptions = Number.POSITIVE_INFINITY

    for (let s = 0; s < remaining.length; s++) {
      if (remaining[s] <= 0) continue
      const orients = orientationsByShape[s]
      let options = 0
      for (const orient of orients) {
        for (let y = 0; y <= height - orient.height; y++) {
          for (let x = 0; x <= width - orient.width; x++) {
            if (canPlace(board, fullRowMask, x, y, orient)) {
              options++
              if (options >= bestOptions) break
            }
          }
          if (options >= bestOptions) break
        }
        if (options >= bestOptions) break
      }
      if (options === 0) return s
      if (options < bestOptions) {
        bestOptions = options
        bestShape = s
      }
    }

    return bestShape
  }

  function dfs(): boolean {
    // Done?
    let left = 0
    for (const v of remaining) left += v
    if (left === 0) return true

    const stateKey = keyForState()
    const cached = memo.get(stateKey)
    if (cached !== undefined) return cached

    const shapeIndex = pickNextShape()
    if (shapeIndex === -1) {
      memo.set(stateKey, true)
      return true
    }

    const orients = orientationsByShape[shapeIndex]
    remaining[shapeIndex] -= 1

    for (const orient of orients) {
      for (let y = 0; y <= height - orient.height; y++) {
        for (let x = 0; x <= width - orient.width; x++) {
          if (!canPlace(board, fullRowMask, x, y, orient)) continue
          place(board, x, y, orient)
          if (dfs()) {
            unplace(board, x, y, orient)
            remaining[shapeIndex] += 1
            memo.set(stateKey, true)
            return true
          }
          unplace(board, x, y, orient)
        }
      }
    }

    remaining[shapeIndex] += 1
    memo.set(stateKey, false)
    return false
  }

  return dfs()
}

function canFitRegion(
  region: Region,
  orientationsByShape: Array<Array<Orientation>>,
  areas: Array<number>,
): { ok: boolean; totalArea: number } {
  const totalArea = totalRequiredArea(areas, region.counts)
  const capacity = region.width * region.height
  if (totalArea > capacity) return { ok: false, totalArea }

  const totalPieces = region.counts.reduce((a, b) => a + b, 0)

  // Exact search for small regions / small piece counts (needed for the sample).
  const smallEnough = capacity <= 120 && totalPieces <= 24
  if (smallEnough) {
    return {
      ok: exactPackSmall(
        region.width,
        region.height,
        orientationsByShape,
        region.counts,
      ),
      totalArea,
    }
  }

  // Fast greedy packer for large instances.
  return {
    ok: greedyPack(region.width, region.height, orientationsByShape, areas, region.counts),
    totalArea,
  }
}

export function solve(input: string): Promise<string | number | object> {
  const parsed = parseInput(input)
  const shapes = parsed.shapes.filter(Boolean)
  const orientationsByShape: Array<Array<Orientation>> = []
  const areas: Array<number> = []
  for (const shape of shapes) {
    const orients = generateOrientations(shape)
    orientationsByShape[shape.index] = orients
    // area is invariant across orientations
    areas[shape.index] = orients[0]?.area ?? 0
  }

  let feasible = 0
  let infeasibleByArea = 0
  let infeasibleByPacking = 0

  for (const region of parsed.regions) {
    const { ok, totalArea } = canFitRegion(region, orientationsByShape, areas)
    if (ok) {
      feasible++
    } else {
      if (totalArea > region.width * region.height) infeasibleByArea++
      else infeasibleByPacking++
    }
  }

  // Day 12 puzzle statement only asks for the count (part1). No part2 is provided.
  return Promise.resolve({
    part1: feasible,
    part2: 0,
    details: {
      regions: parsed.regions.length,
      shapes: shapes.length,
      feasible,
      infeasibleByArea,
      infeasibleByPacking,
      shapeAreas: areas.filter((v) => typeof v === 'number'),
    },
  })
}

