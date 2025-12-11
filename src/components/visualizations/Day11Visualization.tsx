import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import {
  PART1_START,
  PART1_TARGET,
  PART2_START,
  PART2_TARGET,
  PART2_REQUIRED_DEVICES,
  countPathsThroughDevices,
  parseGraph,
  type Graph,
} from '@/solvers/day11'

type NodePosition = {
  id: string
  x: number
  y: number
  level: number
}

type GraphLayout = {
  width: number
  height: number
  nodes: Array<NodePosition>
  edges: Array<{ from: string; to: string }>
  nodeLookup: Map<string, NodePosition>
}

type PathResult = {
  nodes: Array<string>
  edges: Array<[string, string]>
}

const SVG_PADDING = 80
const HORIZONTAL_GAP = 170
const BASE_WIDTH = 640
const BASE_HEIGHT = 420

function buildGraphLayout(graph: Graph, seeds: Array<string>): GraphLayout {
  const allNodes = new Set<string>()
  graph.forEach((outputs, from) => {
    allNodes.add(from)
    outputs.forEach((node) => allNodes.add(node))
  })
  seeds.forEach((seed) => allNodes.add(seed))

  if (allNodes.size === 0) {
    return { width: BASE_WIDTH, height: BASE_HEIGHT, nodes: [], edges: [] }
  }

  const levels = new Map<string, number>()
  const queue: Array<string> = []
  seeds.forEach((seed) => {
    if (!levels.has(seed)) {
      levels.set(seed, 0)
      queue.push(seed)
    }
  })

  while (queue.length > 0) {
    const current = queue.shift()!
    const baseLevel = levels.get(current) ?? 0
    const nextLevel = baseLevel + 1
    const outputs = graph.get(current) ?? []
    outputs.forEach((next) => {
      if (!levels.has(next) || nextLevel < (levels.get(next) ?? Infinity)) {
        levels.set(next, nextLevel)
        queue.push(next)
      }
    })
  }

  let maxLevel = levels.size
    ? Math.max(...Array.from(levels.values()))
    : 0
  const unassigned = Array.from(allNodes).filter((node) => !levels.has(node))
  if (unassigned.length > 0) {
    maxLevel = Math.max(maxLevel, 0)
    unassigned.forEach((node) => levels.set(node, maxLevel + 1))
  }

  const levelBuckets = new Map<number, Array<string>>()
  allNodes.forEach((node) => {
    const level = levels.get(node) ?? 0
    const list = levelBuckets.get(level)
    if (list) {
      list.push(node)
    } else {
      levelBuckets.set(level, [node])
    }
  })

  const sortedLevels = Array.from(levelBuckets.keys()).sort((a, b) => a - b)
  const width = Math.max(
    BASE_WIDTH,
    SVG_PADDING * 2 + (sortedLevels.length - 1) * HORIZONTAL_GAP,
  )
  const maxNodesInLevel =
    sortedLevels.reduce((max, level) => {
      const bucketLength = levelBuckets.get(level)?.length ?? 0
      return Math.max(max, bucketLength)
    }, 1) || 1
  const availableHeight = Math.max(BASE_HEIGHT - SVG_PADDING * 2, 200)
  const height = Math.max(
    BASE_HEIGHT,
    SVG_PADDING * 2 + (maxNodesInLevel - 1) * Math.max(60, availableHeight / Math.max(maxNodesInLevel - 1, 1)),
  )

  const nodes: Array<NodePosition> = []
  sortedLevels.forEach((level, columnIndex) => {
    const bucket = [...(levelBuckets.get(level) ?? [])].sort()
    const bucketSize = bucket.length
    bucket.forEach((nodeId, rowIndex) => {
      const x = SVG_PADDING + columnIndex * HORIZONTAL_GAP
      let y = height / 2
      if (bucketSize > 1) {
        const verticalSpace = height - SVG_PADDING * 2
        y = SVG_PADDING + (verticalSpace * rowIndex) / (bucketSize - 1)
      }
      nodes.push({ id: nodeId, x, y, level })
    })
  })

  const edges: Array<{ from: string; to: string }> = []
  graph.forEach((outputs, from) => {
    outputs.forEach((to) => edges.push({ from, to }))
  })

  const nodeLookup = new Map<string, NodePosition>()
  nodes.forEach((node) => {
    nodeLookup.set(node.id, node)
  })

  return { width, height, nodes, edges, nodeLookup }
}

function findValidPath(
  graph: Graph,
  start: string,
  target: string,
  required: Array<string>,
): PathResult | null {
  const requiredMaskByDevice = new Map<string, number>()
  required.forEach((device, idx) => {
    requiredMaskByDevice.set(device, 1 << idx)
  })
  const fullMask = required.length === 0 ? 0 : 2 ** required.length - 1

  const startMask = requiredMaskByDevice.get(start) ?? 0
  const startKey = `${start}|${startMask}`
  const queue: Array<{ node: string; mask: number; key: string }> = [
    { node: start, mask: startMask, key: startKey },
  ]
  const visited = new Set<string>([startKey])
  const parent = new Map<
    string,
    { prevKey: string | null; node: string; mask: number }
  >()
  parent.set(startKey, { prevKey: null, node: start, mask: startMask })

  while (queue.length > 0) {
    const { node, mask, key } = queue.shift()!

    if (node === target && mask === fullMask) {
      const nodes: Array<string> = []
      let currentKey: string | null = key
      while (currentKey) {
        const entry = parent.get(currentKey)
        if (!entry) {
          break
        }
        nodes.push(entry.node)
        currentKey = entry.prevKey
      }
      nodes.reverse()
      const edges: Array<[string, string]> = []
      for (let i = 0; i < nodes.length - 1; i += 1) {
        edges.push([nodes[i], nodes[i + 1]])
      }
      return { nodes, edges }
    }

    const outputs = graph.get(node) ?? []
    for (const next of outputs) {
      const nextMask = mask | (requiredMaskByDevice.get(next) ?? 0)
      const nextKey = `${next}|${nextMask}`
      if (visited.has(nextKey)) {
        continue
      }
      visited.add(nextKey)
      parent.set(nextKey, { prevKey: key, node: next, mask: nextMask })
      queue.push({ node: next, mask: nextMask, key: nextKey })
    }
  }

  return null
}

function formatBigInt(value: bigint | null): string {
  if (value === null) {
    return '—'
  }
  const maxSafe = BigInt(Number.MAX_SAFE_INTEGER)
  return value <= maxSafe ? Number(value).toLocaleString() : value.toString()
}

export function Day11Visualization({ input }: { input: string }) {
  const [activePart, setActivePart] = useState<1 | 2>(1)
  const { graph, parseError } = useMemo(() => {
    try {
      return { graph: parseGraph(input), parseError: null }
    } catch (error) {
      return {
        graph: null,
        parseError:
          error instanceof Error ? error.message : 'Failed to parse network.',
      }
    }
  }, [input])

  const pathCounts = useMemo(() => {
    if (!graph) {
      return { part1: null, part2: null, error: null as string | null }
    }
    try {
      const part1 = countPathsThroughDevices(graph, PART1_START, PART1_TARGET, [])
      const part2 = countPathsThroughDevices(
        graph,
        PART2_START,
        PART2_TARGET,
        PART2_REQUIRED_DEVICES,
      )
      return { part1, part2, error: null as string | null }
    } catch (error) {
      return {
        part1: null,
        part2: null,
        error:
          error instanceof Error
            ? error.message
            : 'Unable to count signal paths.',
      }
    }
  }, [graph])

  const layout = useMemo(() => {
    if (!graph) {
      return null
    }
    return buildGraphLayout(graph, [PART1_START, PART2_START])
  }, [graph])

  const part1Path = useMemo(() => {
    if (!graph) return null
    return findValidPath(graph, PART1_START, PART1_TARGET, [])
  }, [graph])

  const part2Path = useMemo(() => {
    if (!graph) return null
    return findValidPath(
      graph,
      PART2_START,
      PART2_TARGET,
      PART2_REQUIRED_DEVICES,
    )
  }, [graph])

  const activePath = activePart === 1 ? part1Path : part2Path
  const activeColor = activePart === 1 ? '#22c55e' : '#38bdf8'

  const part1NodeSet = useMemo(
    () => new Set(part1Path?.nodes ?? []),
    [part1Path],
  )
  const part2NodeSet = useMemo(
    () => new Set(part2Path?.nodes ?? []),
    [part2Path],
  )

  if (parseError) {
    return (
      <div className="bg-slate-900/60 border border-red-500/60 rounded-xl p-6 text-red-300">
        Failed to parse network: {parseError}
      </div>
    )
  }

  if (!graph || !layout) {
    return (
      <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-6 text-slate-200">
        No devices detected in the input.
      </div>
    )
  }

  const getNodePosition = (id: string) => layout.nodeLookup.get(id)

  return (
    <div className="space-y-6 text-white">
      {pathCounts.error && (
        <div className="bg-amber-950/40 border border-amber-500/60 rounded-lg px-4 py-3 text-amber-200">
          {pathCounts.error}
        </div>
      )}

      <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-300 tracking-wide uppercase">
              Signal Routing Modes
            </p>
            <h2 className="text-2xl font-semibold">
              Day 11 · Secure Labyrinth
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
              <span className="text-slate-300">Part 1 path</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-sky-400" />
              <span className="text-slate-300">Part 2 path</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-slate-300">Focus</span>
          <ButtonGroup>
            <Button
              variant={activePart === 1 ? 'default' : 'secondary'}
              onClick={() => setActivePart(1)}
            >
              Part 1: you → out
            </Button>
            <Button
              variant={activePart === 2 ? 'default' : 'secondary'}
              onClick={() => setActivePart(2)}
            >
              Part 2: svr → out (dac & fft)
            </Button>
          </ButtonGroup>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide text-slate-400">
                Part 1
              </p>
              <h3 className="text-xl font-semibold text-emerald-300">
                Escape Route
              </h3>
            </div>
            <div className="text-2xl font-mono text-emerald-200">
              {formatBigInt(pathCounts.part1)}
            </div>
          </div>
          <p className="text-sm text-slate-400">
            Total paths from `{PART1_START}` to `{PART1_TARGET}`.
          </p>
          <div className="flex flex-wrap gap-2">
            {(part1Path?.nodes ?? []).map((node) => (
              <span
                key={`p1-${node}`}
                className="px-2 py-1 text-xs rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-100 font-mono"
              >
                {node}
              </span>
            ))}
            {!part1Path && (
              <span className="text-xs text-slate-400">No valid route found.</span>
            )}
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide text-slate-400">
                Part 2
              </p>
              <h3 className="text-xl font-semibold text-sky-300">
                Secure Channel
              </h3>
            </div>
            <div className="text-2xl font-mono text-sky-200">
              {formatBigInt(pathCounts.part2)}
            </div>
          </div>
          <p className="text-sm text-slate-400">
            Paths from `{PART2_START}` to `{PART2_TARGET}` that include{' '}
            {PART2_REQUIRED_DEVICES.map((device) => `\`${device}\``).join(', ')}.
          </p>
          <div className="flex flex-wrap gap-2">
            {(part2Path?.nodes ?? []).map((node) => (
              <span
                key={`p2-${node}`}
                className="px-2 py-1 text-xs rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-100 font-mono"
              >
                {node}
              </span>
            ))}
            {!part2Path && (
              <span className="text-xs text-slate-400">No secure route found.</span>
            )}
          </div>
        </div>
      </div>

      <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-6">
        <p className="text-sm text-slate-400 mb-3">
          Hover a device to see its label. The highlighted path switches between green
          (part 1) and blue (part 2) depending on the focus above.
        </p>

        <div className="overflow-auto">
          <svg
            viewBox={`0 0 ${layout.width} ${layout.height}`}
            className="w-full h-[520px] min-h-[320px]"
          >
            <defs>
              <filter id="node-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="6" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Base edges */}
            {layout.edges.map((edge) => {
              const from = getNodePosition(edge.from)
              const to = getNodePosition(edge.to)
              if (!from || !to) return null
              return (
                <line
                  key={`edge-${edge.from}-${edge.to}`}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="#1f2937"
                  strokeWidth={2}
                  strokeOpacity={0.65}
                />
              )
            })}

            {/* Part 1 path overlay */}
            {part1Path &&
              part1Path.edges.map(([fromId, toId], idx) => {
                const from = getNodePosition(fromId)
                const to = getNodePosition(toId)
                if (!from || !to) return null
                const isFocus = activePart === 1
                return (
                  <line
                    key={`p1-${idx}-${fromId}-${toId}`}
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke="#22c55e"
                    strokeWidth={isFocus ? 7 : 4}
                    strokeLinecap="round"
                    strokeOpacity={isFocus ? 0.95 : 0.4}
                  />
                )
              })}

            {/* Part 2 path overlay */}
            {part2Path &&
              part2Path.edges.map(([fromId, toId], idx) => {
                const from = getNodePosition(fromId)
                const to = getNodePosition(toId)
                if (!from || !to) return null
                const isFocus = activePart === 2
                return (
                  <line
                    key={`p2-${idx}-${fromId}-${toId}`}
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke="#38bdf8"
                    strokeWidth={isFocus ? 7 : 4}
                    strokeLinecap="round"
                    strokeOpacity={isFocus ? 0.95 : 0.4}
                  />
                )
              })}

            {/* Nodes */}
            {layout.nodes.map((node) => {
              const isPart1Node = part1NodeSet.has(node.id)
              const isPart2Node = part2NodeSet.has(node.id)
              const isActive =
                (activePart === 1 && isPart1Node) ||
                (activePart === 2 && isPart2Node)
              const strokeColor = isActive ? activeColor : '#334155'
              const fillColor = isActive ? `${activeColor}33` : '#0f172a'
              return (
                <g key={`node-${node.id}`}>
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={22}
                    fill="#020617"
                    stroke="#0f172a"
                    strokeWidth={6}
                  />
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={16}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={2.5}
                    filter={isActive ? 'url(#node-glow)' : undefined}
                  />
                  {isPart1Node && (
                    <circle
                      cx={node.x - 10}
                      cy={node.y - 18}
                      r={3}
                      fill="#22c55e"
                      opacity={activePart === 1 ? 0.9 : 0.4}
                    />
                  )}
                  {isPart2Node && (
                    <circle
                      cx={node.x + 10}
                      cy={node.y - 18}
                      r={3}
                      fill="#38bdf8"
                      opacity={activePart === 2 ? 0.9 : 0.4}
                    />
                  )}
                  <text
                    x={node.x}
                    y={node.y + 5}
                    textAnchor="middle"
                    fontSize={12}
                    fontFamily="monospace"
                    fill="#e2e8f0"
                  >
                    {node.id}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      </div>

      <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-5 space-y-3">
        <h3 className="text-lg font-semibold">Active Path Steps</h3>
        {activePath ? (
          <div className="flex flex-wrap gap-2">
            {activePath.nodes.map((node, idx) => (
              <div
                key={`step-${node}-${idx}`}
                className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-600"
              >
                <span className="text-xs text-slate-400">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <span
                  className="font-mono text-sm"
                  style={{ color: activeColor }}
                >
                  {node}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-400 text-sm">
            Unable to locate a valid path for this part with the provided input.
          </p>
        )}
      </div>
    </div>
  )
}
