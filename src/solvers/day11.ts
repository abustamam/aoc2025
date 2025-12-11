export type Graph = Map<string, Array<string>>

export const PART1_START = 'you'
export const PART1_TARGET = 'out'
export const PART2_START = 'svr'
export const PART2_TARGET = 'out'
export const PART2_REQUIRED_DEVICES = ['dac', 'fft']

export function parseGraph(rawInput: string): Graph {
  const graph: Graph = new Map()

  rawInput
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .forEach((line) => {
      const separatorIndex = line.indexOf(':')
      if (separatorIndex === -1) {
        throw new Error(`Invalid device definition: "${line}"`)
      }

      const device = line.slice(0, separatorIndex).trim()
      if (device.length === 0) {
        throw new Error(`Missing device name in line: "${line}"`)
      }

      if (graph.has(device)) {
        throw new Error(`Duplicate definition for device "${device}"`)
      }

      const outputsSection = line.slice(separatorIndex + 1).trim()
      const outputs =
        outputsSection.length === 0 ? [] : outputsSection.split(/\s+/g)

      graph.set(device, outputs)
    })

  return graph
}

export function countPathsThroughDevices(
  graph: Graph,
  start: string,
  target: string,
  requiredDevices: Array<string>,
): bigint {
  if (!graph.has(start) && start !== target) {
    return 0n
  }

  const requiredMaskByDevice = new Map<string, number>()
  requiredDevices.forEach((device, index) => {
    requiredMaskByDevice.set(device, 1 << index)
  })
  const fullMask =
    requiredDevices.length === 0 ? 0 : (1 << requiredDevices.length) - 1

  const memo = new Map<string, Map<number, bigint>>()
  const visiting = new Set<string>()

  function dfs(node: string, mask: number): bigint {
    const deviceMask = requiredMaskByDevice.get(node) ?? 0
    const updatedMask = mask | deviceMask

    if (node === target) {
      return updatedMask === fullMask ? 1n : 0n
    }

    let nodeMemo = memo.get(node)
    if (!nodeMemo) {
      nodeMemo = new Map()
      memo.set(node, nodeMemo)
    }

    if (nodeMemo.has(updatedMask)) {
      return nodeMemo.get(updatedMask)!
    }

    if (visiting.has(node)) {
      throw new Error(
        `Cycle detected involving device "${node}" - cannot count paths`,
      )
    }

    visiting.add(node)

    let total = 0n
    const outputs = graph.get(node) ?? []
    for (const next of outputs) {
      total += dfs(next, updatedMask)
    }

    visiting.delete(node)
    nodeMemo.set(updatedMask, total)
    return total
  }

  return dfs(start, 0)
}

function toJsonSafeNumber(value: bigint): string | number {
  const maxSafe = BigInt(Number.MAX_SAFE_INTEGER)
  if (value <= maxSafe) {
    return Number(value)
  }
  return value.toString()
}

export function solve(input: string): Promise<string | number | object> {
  const graph = parseGraph(input)
  const part1Paths = countPathsThroughDevices(graph, PART1_START, PART1_TARGET, [])
  const part2Paths = countPathsThroughDevices(
    graph,
    PART2_START,
    PART2_TARGET,
    PART2_REQUIRED_DEVICES,
  )

  return Promise.resolve({
    part1: toJsonSafeNumber(part1Paths),
    part2: toJsonSafeNumber(part2Paths),
    details: {
      devices: graph.size,
      part1: { start: PART1_START, target: PART1_TARGET },
      part2: {
        start: PART2_START,
        target: PART2_TARGET,
        required: PART2_REQUIRED_DEVICES,
      },
    },
  })
}
