import { useEffect, useMemo, useRef, useState } from 'react'
import type { JoltagePlanResult, LightPlan, Machine } from '@/solvers/day10'
import {
  computeLightPlan,
  minPressesForJoltage,
  parseInput as parseDay10Input,
} from '@/solvers/day10'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'

type LightFrame = {
  step: number
  state: number
  buttonIndex: number | null
  description: string
}

type JoltageFrame = {
  step: number
  counters: Array<number>
  buttonIndex: number | null
  description: string
}

function formatButton(indices: Array<number> | undefined): string {
  if (!indices || indices.length === 0) {
    return '(–)'
  }
  return `(${indices.join(',')})`
}

function maskToArray(state: number, length: number): Array<boolean> {
  return Array.from({ length }, (_, idx) => Boolean(state & (1 << idx)))
}

function buildLightFrames(
  machine: Machine,
  plan: LightPlan | null,
): Array<LightFrame> {
  if (!plan) {
    return []
  }

  const frames: Array<LightFrame> = [
    {
      step: 0,
      state: 0,
      buttonIndex: null,
      description: 'All lights start off.',
    },
  ]

  let currentState = 0
  plan.sequence.forEach((buttonIndex, idx) => {
    const mask = machine.buttonMasks[buttonIndex]
    currentState ^= mask
    const indices = machine.buttonCounterSets[buttonIndex]
    frames.push({
      step: idx + 1,
      state: currentState,
      buttonIndex,
      description: `Press ${formatButton(indices)} to toggle ${indices.length} light${
        indices.length === 1 ? '' : 's'
      }.`,
    })
  })

  return frames
}

function buildJoltageFrames(
  machine: Machine,
  plan: JoltagePlanResult | null,
): Array<JoltageFrame> {
  if (!plan) {
    return []
  }

  const counters = new Array(machine.joltageTargets.length).fill(0)
  const frames: Array<JoltageFrame> = [
    {
      step: 0,
      counters: [...counters],
      buttonIndex: null,
      description: 'Counters start at zero.',
    },
  ]

  let step = 0
  plan.buttonPresses.forEach((pressCount, buttonIndex) => {
    for (let press = 0; press < pressCount; press++) {
      step += 1
      const affected = machine.buttonCounterSets[buttonIndex]
      for (const counterIdx of affected) {
        if (counterIdx < counters.length) {
          counters[counterIdx] += 1
        }
      }
      frames.push({
        step,
        counters: [...counters],
        buttonIndex,
        description: `Press ${formatButton(affected)} (${press + 1}/${pressCount}) to add joltage.`,
      })
    }
  })

  return frames
}

function deriveLightUsage(
  machine: Machine,
  plan: LightPlan | null,
): Array<number> {
  if (!plan) {
    return new Array(machine.buttonCounterSets.length).fill(0)
  }
  const usage = new Array(machine.buttonCounterSets.length).fill(0)
  plan.sequence.forEach((index) => {
    usage[index] += 1
  })
  return usage
}

export function Day10Visualization({ input }: { input: string }) {
  const { machines, error } = useMemo(() => {
    try {
      const parsed = parseDay10Input(input)
      return { machines: parsed, error: null }
    } catch (err) {
      return {
        machines: [],
        error: err instanceof Error ? err.message : 'Failed to parse input.',
      }
    }
  }, [input])

  const [selectedMachineIndex, setSelectedMachineIndex] = useState(0)
  const [part, setPart] = useState<1 | 2>(1)
  const [speed, setSpeed] = useState(6)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentFrame, setCurrentFrame] = useState(0)
  const animationRef = useRef<number>()

  useEffect(() => {
    setSelectedMachineIndex(0)
  }, [machines.length])

  const lightPlans = useMemo(
    () =>
      machines.map((machine) => {
        try {
          return computeLightPlan(machine)
        } catch {
          return null
        }
      }),
    [machines],
  )

  const joltagePlans = useMemo(
    () =>
      machines.map((machine) => {
        try {
          return minPressesForJoltage(machine)
        } catch {
          return null
        }
      }),
    [machines],
  )

  const selectedMachine: Machine | null =
    machines.at(selectedMachineIndex) ?? null
  const selectedLightPlan = lightPlans[selectedMachineIndex] ?? null
  const selectedJoltagePlan = joltagePlans[selectedMachineIndex] ?? null

  const lightUsage = useMemo(() => {
    if (!selectedMachine) return [] as Array<number>
    return deriveLightUsage(selectedMachine, selectedLightPlan)
  }, [selectedMachine, selectedLightPlan])

  const lightFrames = useMemo(() => {
    if (!selectedMachine) return [] as Array<LightFrame>
    return buildLightFrames(selectedMachine, selectedLightPlan)
  }, [selectedMachine, selectedLightPlan])

  const joltageFrames = useMemo(() => {
    if (!selectedMachine) return [] as Array<JoltageFrame>
    return buildJoltageFrames(selectedMachine, selectedJoltagePlan)
  }, [selectedMachine, selectedJoltagePlan])

  const activeFrames = part === 1 ? lightFrames : joltageFrames

  useEffect(() => {
    setCurrentFrame(0)
    setIsPlaying(false)
  }, [part, selectedMachineIndex, activeFrames.length])

  useEffect(() => {
    if (!isPlaying || activeFrames.length === 0) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      return
    }

    const frameInterval = 1000 / Math.max(speed, 1)
    let lastTime = performance.now()

    const tick = (time: number) => {
      const delta = time - lastTime
      if (delta >= frameInterval) {
        setCurrentFrame((prev) => {
          const next = prev + 1
          if (next >= activeFrames.length) {
            setIsPlaying(false)
            return prev
          }
          return next
        })
        lastTime = time
      }
      animationRef.current = requestAnimationFrame(tick)
    }

    animationRef.current = requestAnimationFrame(tick)
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying, speed, activeFrames.length])

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  if (error) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm border border-red-500/60 rounded-xl p-6 text-red-300">
        Failed to parse Day 10 input: {error}
      </div>
    )
  }

  if (machines.length === 0) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 text-white">
        No machines detected in the puzzle input.
      </div>
    )
  }

  if (!selectedMachine) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm border border-amber-500/60 rounded-xl p-6 text-amber-200">
        Selected machine index is out of range.
      </div>
    )
  }

  const machine = selectedMachine

  const totalFrames = Math.max(activeFrames.length - 1, 0)
  const buttonSets = machine.buttonCounterSets
  const joltageTargets = machine.joltageTargets
  const fallbackFrame =
    activeFrames.length > 0 ? activeFrames[currentFrame] : null
  let lightFrame: LightFrame | null = null
  let joltageFrame: JoltageFrame | null = null
  let currentButtonIndex: number | null = null

  if (fallbackFrame) {
    currentButtonIndex = fallbackFrame.buttonIndex
    if (part === 1) {
      lightFrame = fallbackFrame as LightFrame
    } else {
      joltageFrame = fallbackFrame as JoltageFrame
    }
  }

  const lightsMatch =
    part === 1 &&
    lightFrame !== null &&
    machine.targetMask === lightFrame.state

  const frameDescription =
    fallbackFrame?.description ?? 'Awaiting simulation data.'

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <label className="text-white text-sm font-medium">Part</label>
            <ButtonGroup>
              <Button
                variant={part === 1 ? 'default' : 'secondary'}
                onClick={() => setPart(1)}
              >
                Indicator Lights
              </Button>
              <Button
                variant={part === 2 ? 'default' : 'secondary'}
                onClick={() => setPart(2)}
              >
                Joltage Counters
              </Button>
            </ButtonGroup>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="text-white text-sm font-medium">
              Machine {selectedMachineIndex + 1} / {machines.length}
            </label>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() =>
                  setSelectedMachineIndex((prev) => Math.max(prev - 1, 0))
                }
                disabled={selectedMachineIndex === 0}
              >
                Prev
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  setSelectedMachineIndex((prev) =>
                    Math.min(prev + 1, machines.length - 1),
                  )
                }
                disabled={selectedMachineIndex >= machines.length - 1}
              >
                Next
              </Button>
            </div>
            <input
              type="range"
              min={0}
              max={Math.max(machines.length - 1, 0)}
              value={selectedMachineIndex}
              onChange={(e) => setSelectedMachineIndex(Number(e.target.value))}
              className="flex-1 min-w-[160px]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="text-white text-sm font-medium">
              Speed: {speed} steps/sec
            </label>
            <input
              type="range"
              min={1}
              max={200}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="flex-1 min-w-[160px]"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 mb-6">
          <div className="bg-slate-900/40 border border-slate-700 rounded-lg p-4 text-white text-sm space-y-2">
            <div className="font-semibold text-cyan-300">Indicator Lights</div>
            <div>Buttons: {buttonSets.length}</div>
            <div>
              Min Presses:{' '}
              <span className="text-cyan-200">
                {selectedLightPlan ? selectedLightPlan.presses : 'N/A'}
              </span>
            </div>
            <div>
              Target Pattern:{' '}
              <span className="font-mono text-cyan-200">
                {maskToArray(machine.targetMask, machine.numLights)
                  .map((on) => (on ? '#' : '.'))
                  .join('')}
              </span>
            </div>
          </div>
          <div className="bg-slate-900/40 border border-slate-700 rounded-lg p-4 text-white text-sm space-y-2">
            <div className="font-semibold text-emerald-300">Joltage Counters</div>
            <div>Counters: {joltageTargets.length}</div>
            <div>
              Min Presses:{' '}
              <span className="text-emerald-200">
                {selectedJoltagePlan ? selectedJoltagePlan.totalPresses : 'N/A'}
              </span>
            </div>
            <div>
              Hardest Counter:{' '}
              <span className="text-emerald-200">
                {joltageTargets.length > 0
                  ? Math.max(...joltageTargets)
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <ButtonGroup>
              <Button
                variant="default"
                onClick={() => {
                  if (currentFrame >= activeFrames.length - 1) {
                    setCurrentFrame(0)
                  }
                  setIsPlaying((prev) => !prev)
                }}
                disabled={activeFrames.length <= 1}
              >
                {isPlaying ? 'Pause' : 'Play'}
              </Button>
              <Button
                variant="default"
                onClick={() => {
                  setIsPlaying(false)
                  setCurrentFrame(0)
                }}
              >
                Reset
              </Button>
              <Button
                variant="default"
                onClick={() =>
                  setCurrentFrame((prev) => Math.max(prev - 1, 0))
                }
                disabled={currentFrame === 0}
              >
                ← Prev
              </Button>
              <Button
                variant="default"
                onClick={() =>
                  setCurrentFrame((prev) =>
                    Math.min(prev + 1, activeFrames.length - 1),
                  )
                }
                disabled={currentFrame >= activeFrames.length - 1}
              >
                Next →
              </Button>
            </ButtonGroup>
            <div className="text-white text-sm">
              Step {Math.min(currentFrame, totalFrames)} / {totalFrames}
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={Math.max(activeFrames.length - 1, 0)}
            value={currentFrame}
            onChange={(e) => {
              setIsPlaying(false)
              setCurrentFrame(Number(e.target.value))
            }}
            className="w-full"
          />
        </div>

        {activeFrames.length > 0 ? (
          <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
            <div className="bg-slate-900/40 border border-slate-700 rounded-lg p-4 space-y-4">
              <div className="text-white font-semibold">
                {part === 1 ? 'Indicator Lights' : 'Joltage Counters'}
              </div>

              {part === 1 && lightFrame && (
                <>
                  <div className="space-y-2">
                    <div className="text-sm text-slate-300">Current Lights</div>
                    <div className="flex flex-wrap gap-2">
                      {maskToArray(
                        lightFrame.state,
                        machine.numLights,
                      ).map((on, idx) => (
                        <div
                          key={idx}
                          className={`w-8 h-8 rounded-full border transition-colors text-xs flex items-center justify-center font-mono ${
                            on
                              ? 'bg-cyan-400/80 border-cyan-200 text-slate-900'
                              : 'bg-slate-800 border-slate-600 text-slate-400'
                          }`}
                        >
                          {idx}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm text-slate-300">Target</div>
                    <div className="flex flex-wrap gap-2">
                      {maskToArray(
                        machine.targetMask,
                        machine.numLights,
                      ).map((on, idx) => (
                        <div
                          key={`target-${idx}`}
                          className={`w-8 h-8 rounded-full border text-xs flex items-center justify-center font-mono ${
                            on
                              ? 'border-emerald-300 text-emerald-200'
                              : 'border-slate-600 text-slate-500'
                          }`}
                        >
                          {on ? '#' : '.'}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div
                    className={`text-sm font-medium ${
                      lightsMatch ? 'text-emerald-300' : 'text-amber-300'
                    }`}
                  >
                    {lightsMatch
                      ? 'Indicator lights match the goal configuration!'
                      : 'Still searching for the correct configuration...'}
                  </div>
                </>
              )}

              {part === 2 && joltageFrame && (
                <div className="space-y-3">
                  {joltageTargets.map((target, idx) => {
                    const value = joltageFrame.counters[idx] ?? 0
                    const pct =
                      target === 0 ? (value === 0 ? 100 : 0) : Math.min(100, (value / target) * 100)
                    return (
                      <div key={`counter-${idx}`}>
                        <div className="flex justify-between text-xs text-white mb-1">
                          <span>Counter {idx}</span>
                          <span>
                            {value} / {target}
                          </span>
                        </div>
                        <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                          <div
                            className="h-full bg-emerald-400 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="text-slate-200 text-sm">
                {frameDescription}
              </div>
            </div>

            <div className="bg-slate-900/40 border border-slate-700 rounded-lg p-4 space-y-4">
              <div className="text-white font-semibold flex items-center justify-between">
                <span>Buttons</span>
                <span className="text-xs text-slate-400">
                  Highlight shows currently pressed button.
                </span>
              </div>
              <div className="space-y-2">
                {buttonSets.map((indices, idx) => {
                  const isActive = currentButtonIndex === idx
                  const pressesForLights = lightUsage[idx] ?? 0
                  const pressesForJoltage =
                    selectedJoltagePlan?.buttonPresses[idx] ?? 0
                  return (
                    <div
                      key={`button-${idx}`}
                      className={`rounded border px-3 py-2 text-sm flex flex-col gap-1 ${
                        isActive
                          ? 'border-cyan-300 bg-cyan-300/10'
                          : 'border-slate-700 bg-slate-800/40'
                      }`}
                    >
                      <div className="flex justify-between text-white font-mono">
                        <span>{formatButton(indices)}</span>
                        <span># {idx}</span>
                      </div>
                      <div className="text-xs text-slate-300 flex justify-between">
                        <span>Lights: {pressesForLights}</span>
                        <span>Joltage: {pressesForJoltage}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-amber-200">
            Unable to build frames for this machine.
          </div>
        )}

        <div className="mt-6 text-xs text-slate-400">
          Indicator lights use cyan (on) vs slate (off). Joltage counters fill
          toward their targets in emerald. Use the playback controls or slider
          to inspect each button press.
        </div>
      </div>
    </div>
  )
}
