import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
  const animationRef = useRef<number | undefined>(undefined)

  // Interactive game state
  const [interactiveLightState, setInteractiveLightState] = useState(0)
  const [interactiveCounters, setInteractiveCounters] = useState<Array<number>>(
    [],
  )
  const [pressedButtonIndex, setPressedButtonIndex] = useState<number | null>(
    null,
  )
  const [pressedButtonTimeout, setPressedButtonTimeout] =
    useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setSelectedMachineIndex(0)
  }, [machines.length])

  const selectedMachine: Machine | null =
    machines.at(selectedMachineIndex) ?? null

  // Reset interactive state when machine or part changes
  useEffect(() => {
    if (selectedMachine) {
      setInteractiveLightState(0)
      setInteractiveCounters(
        new Array(selectedMachine.joltageTargets.length).fill(0),
      )
      setPressedButtonIndex(null)
    }
    return () => {
      if (pressedButtonTimeout) {
        clearTimeout(pressedButtonTimeout)
      }
    }
  }, [selectedMachineIndex, part, selectedMachine])

  // Handle button press for interactive mode
  const handleButtonPress = useCallback(
    (buttonIndex: number) => {
      if (!selectedMachine) return

      // Set pressed state with visual feedback
      setPressedButtonIndex(buttonIndex)
      const timeout = setTimeout(() => {
        setPressedButtonIndex(null)
      }, 200)
      setPressedButtonTimeout(timeout)

      if (part === 1) {
        // Toggle lights using XOR
        const mask = selectedMachine.buttonMasks[buttonIndex]
        setInteractiveLightState((prev) => prev ^ mask)
      } else {
        // Increment counters
        const affected = selectedMachine.buttonCounterSets[buttonIndex]
        setInteractiveCounters((prev) => {
          const next = [...prev]
          for (const counterIdx of affected) {
            if (counterIdx < next.length) {
              next[counterIdx] += 1
            }
          }
          return next
        })
      }
    },
    [selectedMachine, part],
  )

  // Check if interactive puzzle is solved
  const isInteractiveSolved = useMemo(() => {
    if (!selectedMachine) return false
    if (part === 1) {
      return interactiveLightState === selectedMachine.targetMask
    } else {
      return selectedMachine.joltageTargets.every(
        (target, idx) => interactiveCounters[idx] === target,
      )
    }
  }, [selectedMachine, part, interactiveLightState, interactiveCounters])

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

  const selectedLightPlan = lightPlans[selectedMachineIndex] ?? null
  const selectedJoltagePlan = joltagePlans[selectedMachineIndex] ?? null

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
    part === 1 && lightFrame !== null && machine.targetMask === lightFrame.state

  return (
    <div className="space-y-6">
      {/* Unified Machine Console */}
      <div
        className="border-4 border-slate-700 rounded-2xl p-8 shadow-2xl relative"
        style={{
          background: `
              repeating-linear-gradient(
                0deg,
                #64748b 0px,
                #64748b 1px,
                #475569 1px,
                #475569 2px
              ),
              linear-gradient(135deg, #64748b 0%, #475569 50%, #334155 100%)
            `,
          backgroundSize: '100% 3px, 100% 100%',
          boxShadow:
            'inset 0 0 100px rgba(0, 0, 0, 0.3), 0 8px 32px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Machine Toggle Switch - Top Right */}
        <div className="absolute top-6 right-6">
          <button
            onClick={() => setPart(part === 1 ? 2 : 1)}
            className="relative focus:outline-none"
          >
            {/* Square Metallic Faceplate */}
            <div
              className="relative w-20 h-20"
              style={{
                background: `
                    repeating-linear-gradient(
                      45deg,
                      #94a3b8 0px,
                      #94a3b8 1px,
                      #64748b 1px,
                      #64748b 2px
                    ),
                    linear-gradient(135deg, #cbd5e1 0%, #94a3b8 50%, #64748b 100%)
                  `,
                backgroundSize: '100% 4px, 100% 100%',
                boxShadow:
                  'inset 0 1px 2px rgba(255, 255, 255, 0.4), inset 0 -1px 2px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.4)',
                borderRadius: '2px',
              }}
            >
              {/* Corner Screws */}
              <div
                className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full"
                style={{
                  background:
                    'radial-gradient(circle at 30% 30%, #475569, #334155)',
                  boxShadow:
                    'inset 0 1px 1px rgba(0, 0, 0, 0.5), 0 0 1px rgba(0, 0, 0, 0.3)',
                }}
              >
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-0.5 h-0.5 border-t border-l border-slate-900" />
              </div>
              <div
                className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
                style={{
                  background:
                    'radial-gradient(circle at 30% 30%, #475569, #334155)',
                  boxShadow:
                    'inset 0 1px 1px rgba(0, 0, 0, 0.5), 0 0 1px rgba(0, 0, 0, 0.3)',
                }}
              >
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-0.5 h-0.5 border-t border-l border-slate-900" />
              </div>
              <div
                className="absolute bottom-1 left-1 w-1.5 h-1.5 rounded-full"
                style={{
                  background:
                    'radial-gradient(circle at 30% 30%, #475569, #334155)',
                  boxShadow:
                    'inset 0 1px 1px rgba(0, 0, 0, 0.5), 0 0 1px rgba(0, 0, 0, 0.3)',
                }}
              >
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-0.5 h-0.5 border-t border-l border-slate-900" />
              </div>
              <div
                className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full"
                style={{
                  background:
                    'radial-gradient(circle at 30% 30%, #475569, #334155)',
                  boxShadow:
                    'inset 0 1px 1px rgba(0, 0, 0, 0.5), 0 0 1px rgba(0, 0, 0, 0.3)',
                }}
              >
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-0.5 h-0.5 border-t border-l border-slate-900" />
              </div>

              {/* Central Bushing Area */}
              <div
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full"
                style={{
                  background:
                    'radial-gradient(circle at 30% 30%, #475569, #334155, #1e293b)',
                  boxShadow:
                    'inset 0 2px 4px rgba(0, 0, 0, 0.5), 0 1px 2px rgba(0, 0, 0, 0.3)',
                  border: '2px solid #1e293b',
                }}
              />

              {/* Bat Handle Lever - Pivots from center bushing */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div
                  className={`transform ${
                    part === 2 ? 'rotate-[-45deg]' : 'rotate-[45deg]'
                  }`}
                  style={{
                    transition: 'none', // No animation - instant flick
                    transformOrigin: 'center bottom',
                  }}
                >
                  {/* Orange Ring at Base (where lever enters bushing) */}
                  <div
                    className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2 h-1 rounded-full"
                    style={{
                      background: 'radial-gradient(ellipse, #fb923c, #ea580c)',
                      boxShadow: 'inset 0 1px 1px rgba(0, 0, 0, 0.3)',
                    }}
                  />
                  {/* Lever Shaft - Metallic, extends upward from bushing */}
                  <div
                    className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-7 rounded-full"
                    style={{
                      background:
                        'linear-gradient(to bottom, #e2e8f0, #cbd5e1, #94a3b8)',
                      boxShadow:
                        '0 1px 2px rgba(0, 0, 0, 0.3), inset 0 0 2px rgba(255, 255, 255, 0.3)',
                    }}
                  />
                  {/* Lever Handle (Bullet Tip) - Metallic */}
                  <div
                    className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-3 h-3 rounded-full"
                    style={{
                      background:
                        'radial-gradient(circle at 30% 30%, #f1f5f9, #e2e8f0, #cbd5e1)',
                      boxShadow:
                        '0 2px 4px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.5)',
                    }}
                  />
                </div>
              </div>

              {/* Embossed Text on Faceplate */}
              <div
                className="absolute top-2 left-1/2 transform -translate-x-1/2 text-[7px] font-bold tracking-wider"
                style={{
                  color: '#1e293b',
                  textShadow: '0 1px 1px rgba(255, 255, 255, 0.3)',
                  letterSpacing: '0.5px',
                }}
              >
                MODE
              </div>
            </div>

            {/* Dark Housing Behind */}
            <div
              className="absolute top-2 left-2 w-20 h-20 bg-slate-900 border border-slate-800 rounded-sm -z-10"
              style={{
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.5)',
              }}
            />
          </button>
        </div>

        {/* Big Red Reset Button - Top Left */}
        <button
          onClick={() => {
            setInteractiveLightState(0)
            setInteractiveCounters(
              new Array(selectedMachine.joltageTargets.length).fill(0),
            )
          }}
          className="absolute top-2 left-6 w-24 h-24 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-red-400/50 focus:ring-offset-2 focus:ring-offset-slate-900 active:translate-y-0.5"
        >
          {/* Black Bezel/Ring - Raised from panel, thicker */}
          <div
            className="absolute inset-0 rounded-full bg-black"
            style={{
              boxShadow:
                '0 2px 4px rgba(0, 0, 0, 0.8), inset 0 1px 1px rgba(255, 255, 255, 0.05)',
            }}
          >
            {/* Red Lens Center - Flat with slight convex effect */}
            <div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-red-600"
              style={{
                background:
                  'radial-gradient(circle at 30% 30%, #f87171, #ef4444, #dc2626)',
                boxShadow:
                  '0 0 15px rgba(239, 68, 68, 0.9), 0 0 30px rgba(239, 68, 68, 0.5), inset 0 1px 2px rgba(255, 255, 255, 0.4), inset 0 -1px 2px rgba(0, 0, 0, 0.2)',
              }}
            >
              {/* Subtle lens highlight */}
              <div className="absolute top-2 left-2 w-4 h-4 rounded-full bg-white/50 blur-[1px]" />
            </div>
          </div>
        </button>

        {/* Indicator Lights Section - Always visible */}
        <div className="mb-8 mt-20">
          <div className="bg-slate-950/50 border-2 border-slate-800 rounded-lg p-6">
            <div className="flex flex-wrap gap-4 justify-center">
              {maskToArray(
                isPlaying && lightFrame
                  ? lightFrame.state
                  : interactiveLightState,
                machine.numLights,
              ).map((on, idx) => {
                return (
                  <div key={idx} className="flex flex-col items-center">
                    {/* LED Light */}
                    <div
                      className={`relative w-16 h-16 rounded-full border-2 transition-all duration-300 ${
                        on
                          ? 'border-emerald-400/60 bg-emerald-500'
                          : 'border-slate-600 bg-slate-800'
                      }`}
                      style={{
                        boxShadow: on
                          ? '0 0 20px rgba(34, 197, 94, 0.8), 0 0 40px rgba(34, 197, 94, 0.4), inset 0 0 20px rgba(34, 197, 94, 0.3)'
                          : 'inset 0 4px 8px rgba(0, 0, 0, 0.5)',
                      }}
                    >
                      {/* LED inner glow */}
                      {on && (
                        <div className="absolute inset-2 rounded-full bg-emerald-400/60 blur-sm" />
                      )}
                      {/* LED center */}
                      <div
                        className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full ${
                          on ? 'bg-emerald-300' : 'bg-slate-700'
                        }`}
                        style={{
                          boxShadow: on
                            ? '0 0 12px rgba(34, 197, 94, 1), inset 0 0 8px rgba(255, 255, 255, 0.3)'
                            : 'inset 0 2px 4px rgba(0, 0, 0, 0.5)',
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
            {(isInteractiveSolved || lightsMatch) && part === 1 && (
              <div className="mt-4 text-center">
                <div className="inline-block w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
              </div>
            )}
          </div>
        </div>

        {/* Joltage Gauges Section - Always visible */}
        <div className="mb-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {joltageTargets.map((target, idx) => {
              const value =
                isPlaying && joltageFrame
                  ? (joltageFrame.counters[idx] ?? 0)
                  : (interactiveCounters[idx] ?? 0)
              const pct =
                target === 0
                  ? value === 0
                    ? 100
                    : 0
                  : Math.min(100, (value / target) * 100)
              const angle = (pct / 100) * 180 - 90 // -90 to 90 degrees
              const isComplete = value === target
              return (
                <div
                  key={`gauge-${idx}`}
                  className="bg-slate-950/50 border-2 border-slate-800 rounded-lg p-4"
                >
                  {/* Circular Gauge */}
                  <div className="relative w-24 h-24 mx-auto">
                    <svg viewBox="0 0 100 60" className="w-full h-full">
                      {/* Gauge background arc */}
                      <path
                        d="M 10 50 A 40 40 0 0 1 90 50"
                        fill="none"
                        stroke="#1e293b"
                        strokeWidth="8"
                        strokeLinecap="round"
                      />
                      {/* Gauge fill arc */}
                      <path
                        d="M 10 50 A 40 40 0 0 1 90 50"
                        fill="none"
                        stroke={isComplete ? '#22c55e' : '#3b82f6'}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${(pct / 100) * 125.66} 125.66`}
                        className="transition-all duration-500"
                      />
                      {/* Needle */}
                      <line
                        x1="50"
                        y1="50"
                        x2={50 + Math.cos(((angle - 90) * Math.PI) / 180) * 35}
                        y2={50 + Math.sin(((angle - 90) * Math.PI) / 180) * 35}
                        stroke={isComplete ? '#22c55e' : '#fbbf24'}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        className="transition-all duration-500"
                      />
                      {/* Center dot */}
                      <circle
                        cx="50"
                        cy="50"
                        r="3"
                        fill={isComplete ? '#22c55e' : '#fbbf24'}
                      />
                    </svg>
                    {/* Value display - hidden, just visual feedback */}
                    {isComplete && (
                      <div className="absolute bottom-0 left-0 right-0 text-center">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 mx-auto animate-pulse" />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Control Panel - Buttons */}
        <div>
          <div className="bg-slate-950/50 border-2 border-slate-800 rounded-lg p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {buttonSets.map((_, idx) => {
                const isPressed = pressedButtonIndex === idx
                const isSimulatedActive = currentButtonIndex === idx
                return (
                  <div
                    key={`button-${idx}`}
                    className="flex flex-col items-center gap-2"
                  >
                    {/* LED Indicator */}
                    <div className="relative">
                      <div
                        className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                          isPressed || isSimulatedActive
                            ? 'bg-blue-500'
                            : 'bg-slate-700'
                        }`}
                        style={{
                          boxShadow:
                            isPressed || isSimulatedActive
                              ? '0 0 8px rgba(59, 130, 246, 0.9), 0 0 16px rgba(59, 130, 246, 0.5)'
                              : 'none',
                        }}
                      />
                    </div>

                    {/* Blue Button - Industrial Style with Bezel */}
                    <button
                      onClick={() => handleButtonPress(idx)}
                      className={`relative w-20 h-20 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                        isPressed ? 'translate-y-0.5' : ''
                      }`}
                    >
                      {/* Black Bezel/Ring - Raised from panel, thicker */}
                      <div
                        className="absolute inset-0 rounded-full bg-black"
                        style={{
                          boxShadow:
                            '0 2px 4px rgba(0, 0, 0, 0.8), inset 0 1px 1px rgba(255, 255, 255, 0.05)',
                        }}
                      >
                        {/* Colored Lens Center - Flat with slight convex effect */}
                        <div
                          className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full transition-all duration-200 ${
                            isPressed || isSimulatedActive
                              ? 'bg-blue-500'
                              : 'bg-blue-600'
                          }`}
                          style={{
                            background:
                              isPressed || isSimulatedActive
                                ? 'radial-gradient(circle at 30% 30%, #60a5fa, #3b82f6, #2563eb)'
                                : 'radial-gradient(circle at 30% 30%, #3b82f6, #2563eb, #1e40af)',
                            boxShadow:
                              isPressed || isSimulatedActive
                                ? '0 0 12px rgba(59, 130, 246, 0.9), 0 0 24px rgba(59, 130, 246, 0.5), inset 0 1px 2px rgba(255, 255, 255, 0.4), inset 0 -1px 2px rgba(0, 0, 0, 0.2)'
                                : '0 0 10px rgba(59, 130, 246, 0.7), 0 0 20px rgba(59, 130, 246, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.3), inset 0 -1px 2px rgba(0, 0, 0, 0.3)',
                          }}
                        >
                          {/* Subtle lens highlight */}
                          <div className="absolute top-1.5 left-1.5 w-3 h-3 rounded-full bg-white/50 blur-[1px]" />
                        </div>
                      </div>
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Success Indicators - Subtle */}
        {isInteractiveSolved && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
            <div
              className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"
              style={{ animationDelay: '0.2s' }}
            />
            <div
              className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"
              style={{ animationDelay: '0.4s' }}
            />
          </div>
        )}
      </div>

      {/* Controls Panel - Bottom */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
        <div className="flex flex-col gap-4 mb-6">
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
            <div className="font-semibold text-emerald-300">
              Joltage Counters
            </div>
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

        <div className="flex flex-col gap-3">
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
                onClick={() => setCurrentFrame((prev) => Math.max(prev - 1, 0))}
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
      </div>
    </div>
  )
}
