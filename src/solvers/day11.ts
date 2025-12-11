type Graph = Map<string, Array<string>>

const START_DEVICE = 'you'
const TARGET_DEVICE = 'out'

function parseGraph(rawInput: string): Graph {
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

function countDistinctPaths(
  graph: Graph,
  start: string,
  target: string,
): bigint {
  const memo = new Map<string, bigint>()
  const visiting = new Set<string>()

  function dfs(node: string): bigint {
    if (node === target) {
      return 1n
    }

    if (memo.has(node)) {
      return memo.get(node)!
    }

    if (visiting.has(node)) {
      throw new Error(
        `Cycle detected involving device "${node}" - cannot count paths`,
      )
    }

    visiting.add(node)

    const outputs = graph.get(node) ?? []
    let total = 0n
    for (const next of outputs) {
      total += dfs(next)
    }

    visiting.delete(node)
    memo.set(node, total)
    return total
  }

  if (!graph.has(start) && start !== target) {
    return 0n
  }

  return dfs(start)
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
  const pathCount = countDistinctPaths(graph, START_DEVICE, TARGET_DEVICE)

  return Promise.resolve({
    part1: toJsonSafeNumber(pathCount),
    part2: 'Not implemented yet',
    details: {
      devices: graph.size,
      start: START_DEVICE,
      target: TARGET_DEVICE,
    },
  })
}
