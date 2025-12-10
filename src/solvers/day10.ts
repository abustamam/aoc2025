type Machine = {
  numLights: number
  targetMask: number
  buttonMasks: number[]
  buttonCounterSets: number[][]
  joltageTargets: number[]
}

class Fraction {
  readonly num: bigint
  readonly den: bigint

  constructor(num: bigint | number, den: bigint | number = 1n) {
    let numerator = typeof num === 'number' ? BigInt(num) : num
    let denominator = typeof den === 'number' ? BigInt(den) : den

    if (denominator === 0n) {
      throw new Error('Fraction denominator cannot be zero')
    }

    if (numerator === 0n) {
      this.num = 0n
      this.den = 1n
      return
    }

    if (denominator < 0n) {
      numerator = -numerator
      denominator = -denominator
    }

    const gcdValue = Fraction.gcd(Fraction.abs(numerator), denominator)
    this.num = numerator / gcdValue
    this.den = denominator / gcdValue
  }

  static readonly ZERO = new Fraction(0n)
  static readonly ONE = new Fraction(1n)

  static abs(value: bigint): bigint {
    return value < 0n ? -value : value
  }

  static gcd(a: bigint, b: bigint): bigint {
    let x = Fraction.abs(a)
    let y = Fraction.abs(b)
    while (y !== 0n) {
      const temp = x % y
      x = y
      y = temp
    }
    return x
  }

  static fromInt(value: number | bigint): Fraction {
    return new Fraction(value)
  }

  add(other: Fraction): Fraction {
    return new Fraction(
      this.num * other.den + other.num * this.den,
      this.den * other.den,
    )
  }

  sub(other: Fraction): Fraction {
    return new Fraction(
      this.num * other.den - other.num * this.den,
      this.den * other.den,
    )
  }

  mul(other: Fraction): Fraction {
    return new Fraction(this.num * other.num, this.den * other.den)
  }

  div(other: Fraction): Fraction {
    if (other.num === 0n) {
      throw new Error('Division by zero fraction')
    }
    return new Fraction(this.num * other.den, this.den * other.num)
  }

  mulInt(value: number | bigint): Fraction {
    if (typeof value === 'number') {
      if (!Number.isInteger(value)) {
        throw new Error('mulInt expects an integer value')
      }
      return new Fraction(this.num * BigInt(value), this.den)
    }
    return new Fraction(this.num * value, this.den)
  }

  isZero(): boolean {
    return this.num === 0n
  }

  isInteger(): boolean {
    return this.den === 1n
  }

  compare(other: Fraction): number {
    const left = this.num * other.den
    const right = other.num * this.den
    if (left < right) return -1
    if (left > right) return 1
    return 0
  }

  toNumber(): number {
    return Number(this.num) / Number(this.den)
  }
}

type PivotRow = {
  pivotCol: number
  rhs: Fraction
  minAllowed: Fraction
  maxAllowed: Fraction
  coeffs: Fraction[]
  minSuffix: Fraction[]
  maxSuffix: Fraction[]
  sourceRow: number
}

function parseInput(rawInput: string): Machine[] {
  const machines: Machine[] = []
  const lines = rawInput
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  for (let i = 0; i < lines.length; i++) {
    machines.push(parseMachine(lines[i], i + 1))
  }

  return machines
}

function parseMachine(line: string, lineNumber: number): Machine {
  const indicatorMatch = line.match(/\[([.#]+)\]/)
  if (!indicatorMatch) {
    throw new Error(`Line ${lineNumber}: missing indicator diagram`)
  }

  const targetString = indicatorMatch[1]
  const numLights = targetString.length
  let targetMask = 0
  for (let i = 0; i < targetString.length; i++) {
    const char = targetString[i]
    if (char === '#') {
      targetMask |= 1 << i
    } else if (char !== '.') {
      throw new Error(
        `Line ${lineNumber}: invalid indicator character "${char}" (expected "." or "#")`,
      )
    }
  }

  const joltageMatch = line.match(/\{([^}]*)\}/)
  if (!joltageMatch) {
    throw new Error(`Line ${lineNumber}: missing joltage requirements`)
  }
  const joltageTargets = joltageMatch[1]
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
    .map((value) => Number(value))

  if (joltageTargets.length !== numLights) {
    throw new Error(
      `Line ${lineNumber}: joltage requirement count (${joltageTargets.length}) does not match indicator lights (${numLights})`,
    )
  }

  const buttonMatches = [...line.matchAll(/\(([^)]*)\)/g)]
  const buttonMasks: number[] = []
  const buttonCounterSets: number[][] = []

  for (const match of buttonMatches) {
    const rawIndices = match[1]
    const indices = rawIndices
      .split(',')
      .map((value) => value.trim())
      .filter((value) => value.length > 0)
      .map((value) => {
        const idx = Number(value)
        if (!Number.isInteger(idx)) {
          throw new Error(
            `Line ${lineNumber}: invalid button index "${value}" (expected integer)`,
          )
        }
        if (idx < 0 || idx >= numLights) {
          throw new Error(
            `Line ${lineNumber}: button index ${idx} out of bounds for ${numLights} lights`,
          )
        }
        return idx
      })

    if (indices.length === 0) {
      continue
    }

    let mask = 0
    for (const idx of indices) {
      mask |= 1 << idx
    }
    buttonMasks.push(mask)
    buttonCounterSets.push(indices)
  }

  return {
    numLights,
    targetMask,
    buttonMasks,
    buttonCounterSets,
    joltageTargets,
  }
}

function bfsMinPresses(
  numLights: number,
  buttonMasks: number[],
  targetMask: number,
): number {
  if (targetMask === 0) {
    return 0
  }
  if (buttonMasks.length === 0) {
    return Number.POSITIVE_INFINITY
  }

  const totalStates = 1 << numLights
  const dist = new Int16Array(totalStates)
  dist.fill(-1)
  const queue = new Uint32Array(totalStates)
  let head = 0
  let tail = 0

  dist[0] = 0
  queue[tail++] = 0

  while (head < tail) {
    const state = queue[head++]
    const currentSteps = dist[state]

    if (state === targetMask) {
      return currentSteps
    }

    const nextSteps = currentSteps + 1
    for (const mask of buttonMasks) {
      const nextState = state ^ mask
      if (dist[nextState] === -1) {
        dist[nextState] = nextSteps
        queue[tail++] = nextState
      }
    }
  }

  return Number.POSITIVE_INFINITY
}

function buildAugmentedMatrix(
  buttonCounterSets: number[][],
  counterCount: number,
  targets: number[],
): Fraction[][] {
  const cols = buttonCounterSets.length
  const matrix = Array.from({ length: counterCount }, () =>
    Array.from({ length: cols + 1 }, () => Fraction.ZERO),
  )

  for (let col = 0; col < cols; col++) {
    for (const counter of buttonCounterSets[col]) {
      matrix[counter][col] = Fraction.ONE
    }
  }

  for (let row = 0; row < counterCount; row++) {
    matrix[row][cols] = Fraction.fromInt(targets[row])
  }

  return matrix
}

function rref(
  matrix: Fraction[][],
  variableCount: number,
): { matrix: Fraction[][]; pivotColumnsByRow: number[] } {
  const rowCount = matrix.length
  const pivotColumnsByRow = new Array<number>(rowCount).fill(-1)
  let currentRow = 0

  for (let col = 0; col < variableCount && currentRow < rowCount; col++) {
    let pivotRow = currentRow
    while (pivotRow < rowCount && matrix[pivotRow][col].isZero()) {
      pivotRow++
    }
    if (pivotRow === rowCount) {
      continue
    }

    const temp = matrix[currentRow]
    matrix[currentRow] = matrix[pivotRow]
    matrix[pivotRow] = temp

    const pivotValue = matrix[currentRow][col]
    for (let j = col; j < matrix[currentRow].length; j++) {
      matrix[currentRow][j] = matrix[currentRow][j].div(pivotValue)
    }

    for (let r = 0; r < rowCount; r++) {
      if (r === currentRow) {
        continue
      }
      const factor = matrix[r][col]
      if (factor.isZero()) {
        continue
      }
      for (let j = col; j < matrix[r].length; j++) {
        matrix[r][j] = matrix[r][j].sub(factor.mul(matrix[currentRow][j]))
      }
    }

    pivotColumnsByRow[currentRow] = col
    currentRow++
  }

  return { matrix, pivotColumnsByRow }
}

function computeVariableUpperBounds(
  buttonCounterSets: number[][],
  targets: number[],
): number[] {
  return buttonCounterSets.map((counters) => {
    if (counters.length === 0) {
      return 0
    }
    let bound = Number.POSITIVE_INFINITY
    for (const index of counters) {
      bound = Math.min(bound, targets[index])
    }
    if (!Number.isFinite(bound)) {
      return 0
    }
    return bound
  })
}

function minPressesForJoltage(machine: Machine): number {
  const targets = machine.joltageTargets
  if (targets.length === 0) {
    return 0
  }
  const buttonSets = machine.buttonCounterSets
  if (buttonSets.length === 0) {
    if (targets.every((value) => value === 0)) {
      return 0
    }
    throw new Error('Machine has joltage requirements but no buttons to configure them')
  }

  const augmented = buildAugmentedMatrix(buttonSets, targets.length, targets)
  const { matrix, pivotColumnsByRow } = rref(augmented, buttonSets.length)
  const upperBounds = computeVariableUpperBounds(buttonSets, targets)

  const pivotRows: PivotRow[] = []
  const pivotColumnSet = new Set<number>()

  for (let row = 0; row < matrix.length; row++) {
    const pivotCol = pivotColumnsByRow[row]
    const rhs = matrix[row][buttonSets.length]
    const hasCoefficients = matrix[row]
      .slice(0, buttonSets.length)
      .some((value) => !value.isZero())

    if (!hasCoefficients && !rhs.isZero()) {
      throw new Error('Machine cannot satisfy joltage requirements with available buttons')
    }

    if (pivotCol === -1) {
      continue
    }

    pivotColumnSet.add(pivotCol)
    const upperBound = upperBounds[pivotCol]
    const minAllowed = rhs.sub(Fraction.fromInt(upperBound))
    pivotRows.push({
      pivotCol,
      rhs,
      minAllowed,
      maxAllowed: rhs,
      coeffs: [],
      minSuffix: [],
      maxSuffix: [],
      sourceRow: row,
    })
  }

  const freeColumns: number[] = []
  for (let col = 0; col < buttonSets.length; col++) {
    if (!pivotColumnSet.has(col)) {
      freeColumns.push(col)
    }
  }

  const freeCount = freeColumns.length
  if (pivotRows.length === 0) {
    // No constraints; minimal presses is zero because we can leave all counters at zero.
    return 0
  }

  const freeVarInfos = freeColumns.map((col, idx) => ({
    col,
    bound: upperBounds[col],
    originalIndex: idx,
  }))

  freeVarInfos.sort((a, b) => {
    if (a.bound === b.bound) {
      return a.col - b.col
    }
    return a.bound - b.bound
  })

  const freeBounds = freeVarInfos.map((info) => info.bound)
  const order = freeVarInfos.map((info) => info.originalIndex)

  for (const row of pivotRows) {
    const coeffs: Fraction[] = []
    for (const idx of order) {
      const column = freeColumns[idx]
      coeffs.push(matrix[row.sourceRow][column])
    }
    row.coeffs = coeffs
    row.minSuffix = new Array(freeCount + 1).fill(Fraction.ZERO)
    row.maxSuffix = new Array(freeCount + 1).fill(Fraction.ZERO)
  }

  for (const row of pivotRows) {
    row.minSuffix[freeCount] = Fraction.ZERO
    row.maxSuffix[freeCount] = Fraction.ZERO
    for (let idx = freeCount - 1; idx >= 0; idx--) {
      const coeff = row.coeffs[idx]
      const bound = freeBounds[idx]
      let minContribution = Fraction.ZERO
      let maxContribution = Fraction.ZERO
      if (!coeff.isZero() && bound > 0) {
        const comparison = coeff.compare(Fraction.ZERO)
        if (comparison > 0) {
          maxContribution = coeff.mulInt(bound)
        } else if (comparison < 0) {
          minContribution = coeff.mulInt(bound)
        }
      }
      row.minSuffix[idx] = minContribution.add(row.minSuffix[idx + 1])
      row.maxSuffix[idx] = maxContribution.add(row.maxSuffix[idx + 1])
    }
  }

  if (freeCount === 0) {
    let total = 0
    for (const row of pivotRows) {
      if (!row.rhs.isInteger()) {
        throw new Error('Machine requires non-integer number of button presses')
      }
      const presses = row.rhs.toNumber()
      const bound = upperBounds[row.pivotCol]
      if (presses < 0 || presses > bound) {
        throw new Error('Machine joltage solution violates button bounds')
      }
      total += presses
    }
    return total
  }

  const assignedContribution = pivotRows.map(() => Fraction.ZERO)
  let best = Number.POSITIVE_INFINITY

  function dfs(index: number, partialSum: number) {
    if (index === freeCount) {
      let total = partialSum
      for (let rowIdx = 0; rowIdx < pivotRows.length; rowIdx++) {
        const row = pivotRows[rowIdx]
        const pivotValue = row.rhs.sub(assignedContribution[rowIdx])
        if (!pivotValue.isInteger()) {
          return
        }
        const value = pivotValue.toNumber()
        const bound = upperBounds[row.pivotCol]
        if (value < 0 || value > bound) {
          return
        }
        total += value
      }
      if (total < best) {
        best = total
      }
      return
    }

    const bound = freeBounds[index]
    if (bound === 0) {
      if (
        pivotRows.every((row, rowIdx) => {
          const minPossible = assignedContribution[rowIdx].add(
            row.minSuffix[index + 1],
          )
          const maxPossible = assignedContribution[rowIdx].add(
            row.maxSuffix[index + 1],
          )
          return (
            maxPossible.compare(row.minAllowed) >= 0 &&
            minPossible.compare(row.maxAllowed) <= 0
          )
        })
      ) {
        dfs(index + 1, partialSum)
      }
      return
    }

    let maxValue = bound
    if (Number.isFinite(best)) {
      const remainingBudget = best - partialSum
      if (remainingBudget <= 0) {
        return
      }
      maxValue = Math.min(maxValue, remainingBudget - 1)
    }
    if (maxValue < 0) {
      return
    }

    for (let value = 0; value <= maxValue; value++) {
      if (value > 0) {
        for (let rowIdx = 0; rowIdx < pivotRows.length; rowIdx++) {
          const coeff = pivotRows[rowIdx].coeffs[index]
          if (!coeff.isZero()) {
            assignedContribution[rowIdx] = assignedContribution[rowIdx].add(
              coeff.mulInt(value),
            )
          }
        }
      }

      let feasible = true
      for (let rowIdx = 0; rowIdx < pivotRows.length; rowIdx++) {
        const row = pivotRows[rowIdx]
        const minPossible = assignedContribution[rowIdx].add(
          row.minSuffix[index + 1],
        )
        const maxPossible = assignedContribution[rowIdx].add(
          row.maxSuffix[index + 1],
        )
        if (
          maxPossible.compare(row.minAllowed) < 0 ||
          minPossible.compare(row.maxAllowed) > 0
        ) {
          feasible = false
          break
        }
      }

      if (feasible) {
        dfs(index + 1, partialSum + value)
      }

      if (value > 0) {
        for (let rowIdx = 0; rowIdx < pivotRows.length; rowIdx++) {
          const coeff = pivotRows[rowIdx].coeffs[index]
          if (!coeff.isZero()) {
            assignedContribution[rowIdx] = assignedContribution[rowIdx].sub(
              coeff.mulInt(value),
            )
          }
        }
      }
    }
  }

  dfs(0, 0)

  if (!Number.isFinite(best)) {
    throw new Error('Failed to find minimal joltage configuration')
  }

  return best
}

export async function solve(
  input: string,
): Promise<string | number | object> {
  const machines = parseInput(input)

  if (machines.length === 0) {
    return {
      part1: 0,
      part2: 0,
      details: {
        machines: 0,
      },
    }
  }

  let part1Total = 0
  let part1HardestMachine = 0
  let part1HardestPresses = 0

  let part2Total = 0
  let part2HardestMachine = 0
  let part2HardestPresses = 0

  machines.forEach((machine, idx) => {
    const minPresses = bfsMinPresses(
      machine.numLights,
      machine.buttonMasks,
      machine.targetMask,
    )
    if (!Number.isFinite(minPresses)) {
      throw new Error(
        `Machine ${idx + 1} cannot be configured with the provided buttons`,
      )
    }
    part1Total += minPresses
    if (minPresses > part1HardestPresses) {
      part1HardestPresses = minPresses
      part1HardestMachine = idx + 1
    }

    const joltagePresses = minPressesForJoltage(machine)
    part2Total += joltagePresses
    if (joltagePresses > part2HardestPresses) {
      part2HardestPresses = joltagePresses
      part2HardestMachine = idx + 1
    }
  })

  return {
    part1: part1Total,
    part2: part2Total,
    details: {
      machines: machines.length,
      part1HardestMachine,
      part1HardestPresses,
      part2HardestMachine,
      part2HardestPresses,
    },
  }
}

