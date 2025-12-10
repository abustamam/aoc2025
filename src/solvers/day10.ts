type Machine = {
  numLights: number
  targetMask: number
  buttonMasks: number[]
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

  const buttonMatches = [...line.matchAll(/\(([^)]*)\)/g)]
  if (buttonMatches.length === 0) {
    return {
      numLights,
      targetMask,
      buttonMasks: [],
    }
  }

  const buttonMasks: number[] = []
  for (const match of buttonMatches) {
    const rawIndices = match[1]
    const indices = rawIndices
      .split(',')
      .map((value) => value.trim())
      .filter((value) => value.length > 0)

    if (indices.length === 0) {
      continue
    }

    let mask = 0
    for (const value of indices) {
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
      mask |= 1 << idx
    }
    if (mask !== 0) {
      buttonMasks.push(mask)
    }
  }

  return {
    numLights,
    targetMask,
    buttonMasks,
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

export async function solve(
  input: string,
): Promise<string | number | object> {
  const machines = parseInput(input)

  if (machines.length === 0) {
    return {
      part1: 0,
      part2: null,
      details: {
        machines: 0,
      },
    }
  }

  let totalPresses = 0
  let hardestPresses = 0
  let hardestMachine = 0

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
    totalPresses += minPresses
    if (minPresses > hardestPresses) {
      hardestPresses = minPresses
      hardestMachine = idx + 1
    }
  })

  return {
    part1: totalPresses,
    part2: null,
    details: {
      machines: machines.length,
      hardestMachine,
      hardestPresses,
    },
  }
}

