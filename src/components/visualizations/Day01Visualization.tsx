import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'

interface Rotation {
  direction: 'L' | 'R'
  distance: number
}

interface RotationStep {
  rotationIndex: number
  stepIndex: number
  dialPosition: number
  isZero: boolean
  isEndOfRotation: boolean
}

function modFloor0(x: number): number {
  return ((x % 100) + 100) % 100
}

function parseLine(line: string): Rotation {
  const [direction, ...distanceStr] = line.split('')
  const distance = parseInt(distanceStr.join(''))
  return { direction: direction as 'L' | 'R', distance }
}

function generateSteps(rotations: Array<Rotation>): Array<RotationStep> {
  const steps: Array<RotationStep> = []
  let dial = 50

  for (let rotIdx = 0; rotIdx < rotations.length; rotIdx++) {
    const { direction, distance } = rotations[rotIdx]

    // For each click in the rotation
    for (let step = 1; step <= distance; step++) {
      if (direction === 'R') {
        dial = (dial + 1) % 100
      } else {
        dial = modFloor0(dial - 1)
      }

      const isZero = dial === 0
      const isEndOfRotation = step === distance

      steps.push({
        rotationIndex: rotIdx,
        stepIndex: step,
        dialPosition: dial,
        isZero,
        isEndOfRotation,
      })
    }
  }

  return steps
}

export function Day01Visualization({ input }: { input: string }) {
  const [speed, setSpeed] = useState(5) // clicks per second
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [part, setPart] = useState<1 | 2>(1)
  const [steps, setSteps] = useState<Array<RotationStep>>([])
  const [rotations, setRotations] = useState<Array<Rotation>>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>(0)
  const animatedDialRef = useRef<number>(50)
  const targetDialRef = useRef<number>(50)

  // Parse input and generate steps
  useEffect(() => {
    const lines = input
      .trim()
      .split('\n')
      .filter((line) => line.length > 0)
    const parsedRotations = lines.map(parseLine)
    setRotations(parsedRotations)
    const generatedSteps = generateSteps(parsedRotations)
    setSteps(generatedSteps)
    setCurrentStep(0)
    animatedDialRef.current = 50
    targetDialRef.current = 50
  }, [input])

  // Calculate counts
  const part1Count = steps.filter((s) => s.isEndOfRotation && s.isZero).length
  const part2Count = steps.filter((s) => s.isZero).length

  const drawDial = useCallback(
    (stepIndex: number, animatedDial: number) => {
      const canvas = canvasRef.current
      if (!canvas || stepIndex >= steps.length) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const size = Math.min(600, window.innerWidth * 0.8)
      canvas.width = size
      canvas.height = size

      const centerX = size / 2
      const centerY = size / 2
      const dialRadius = size * 0.4
      const innerRadius = size * 0.25
      const numberRadius = size * 0.35

      // Clear canvas
      ctx.fillStyle = '#0f172a'
      ctx.fillRect(0, 0, size, size)

      const currentStepData = steps[stepIndex]

      // Use animated dial position for smooth rotation
      const animatedDialNormalized =
        animatedDial < 0 ? animatedDial + 100 : animatedDial
      // Rotation offset: dial rotates counter-clockwise so number N appears at top
      // When dial is at position N, rotate by -N/100 * 2π to bring number N to top
      const rotationOffset = -(animatedDialNormalized / 100) * Math.PI * 2

      // Save context for rotation
      ctx.save()
      ctx.translate(centerX, centerY)
      ctx.rotate(rotationOffset)

      // Draw the rotary dial (the rotating part)
      // Dial face (brushed metallic look - lighter silver)
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, dialRadius)
      gradient.addColorStop(0, '#cbd5e1')
      gradient.addColorStop(0.4, '#94a3b8')
      gradient.addColorStop(0.8, '#64748b')
      gradient.addColorStop(1, '#475569')
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(0, 0, dialRadius, 0, Math.PI * 2)
      ctx.fill()

      // Add subtle texture lines for brushed metal effect
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)'
      ctx.lineWidth = 1
      for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI * 2
        ctx.beginPath()
        ctx.moveTo(Math.cos(angle) * innerRadius, Math.sin(angle) * innerRadius)
        ctx.lineTo(Math.cos(angle) * dialRadius, Math.sin(angle) * dialRadius)
        ctx.stroke()
      }

      // Inner ring (separator)
      ctx.strokeStyle = '#64748b'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(0, 0, innerRadius, 0, Math.PI * 2)
      ctx.stroke()

      // Draw numbers on the rotating dial with radial orientation
      // Numbers are oriented so their base points toward center, top points outward
      // This means the number at the top (12 o'clock) is always rightside up
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      // Draw all numbers (0-99) around the dial
      for (let i = 0; i < 100; i++) {
        // Position of number on the dial
        const angle = (i / 100) * Math.PI * 2 - Math.PI / 2
        const x = Math.cos(angle) * numberRadius
        const y = Math.sin(angle) * numberRadius

        // Rotate text so it's oriented radially (base toward center)
        // The text rotation is angle + PI/2 so the number is readable when at top
        const textRotation = angle + Math.PI / 2

        // Draw every number, but make some larger/more prominent
        if (i % 10 === 0) {
          ctx.font = `bold ${size * 0.028}px monospace`
          ctx.fillStyle = '#1e293b'
        } else if (i % 5 === 0) {
          ctx.font = `bold ${size * 0.02}px monospace`
          ctx.fillStyle = '#334155'
        } else {
          ctx.font = `${size * 0.016}px monospace`
          ctx.fillStyle = '#475569'
        }

        // Save context, rotate, draw text, restore
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(textRotation)
        ctx.fillText(i.toString().padStart(2, '0'), 0, 0)
        ctx.restore()
      }

      // Draw tick marks on the dial (fine marks like a real safe)
      ctx.strokeStyle = '#475569'
      for (let i = 0; i < 100; i++) {
        const angle = (i / 100) * Math.PI * 2 - Math.PI / 2
        const isMajor = i % 10 === 0
        const isMinor = i % 5 === 0

        if (isMajor) {
          ctx.strokeStyle = '#1e293b'
          ctx.lineWidth = 2
          const tickLength = size * 0.025
          const startRadius = dialRadius - tickLength
          ctx.beginPath()
          ctx.moveTo(
            Math.cos(angle) * startRadius,
            Math.sin(angle) * startRadius,
          )
          ctx.lineTo(Math.cos(angle) * dialRadius, Math.sin(angle) * dialRadius)
          ctx.stroke()
        } else if (isMinor) {
          ctx.strokeStyle = '#334155'
          ctx.lineWidth = 1.5
          const tickLength = size * 0.018
          const startRadius = dialRadius - tickLength
          ctx.beginPath()
          ctx.moveTo(
            Math.cos(angle) * startRadius,
            Math.sin(angle) * startRadius,
          )
          ctx.lineTo(Math.cos(angle) * dialRadius, Math.sin(angle) * dialRadius)
          ctx.stroke()
        } else {
          ctx.strokeStyle = '#475569'
          ctx.lineWidth = 1
          const tickLength = size * 0.012
          const startRadius = dialRadius - tickLength
          ctx.beginPath()
          ctx.moveTo(
            Math.cos(angle) * startRadius,
            Math.sin(angle) * startRadius,
          )
          ctx.lineTo(Math.cos(angle) * dialRadius, Math.sin(angle) * dialRadius)
          ctx.stroke()
        }
      }

      // Draw center hub (knob with brushed metal look)
      const hubGradient = ctx.createRadialGradient(
        0,
        0,
        0,
        0,
        0,
        innerRadius * 0.65,
      )
      hubGradient.addColorStop(0, '#94a3b8')
      hubGradient.addColorStop(0.3, '#64748b')
      hubGradient.addColorStop(0.7, '#475569')
      hubGradient.addColorStop(1, '#334155')
      ctx.fillStyle = hubGradient
      ctx.beginPath()
      ctx.arc(0, 0, innerRadius * 0.65, 0, Math.PI * 2)
      ctx.fill()

      // Outer ring of hub
      ctx.strokeStyle = '#1e293b'
      ctx.lineWidth = 2
      ctx.stroke()

      // Inner darker center (screw head)
      ctx.fillStyle = '#1e293b'
      ctx.beginPath()
      ctx.arc(0, 0, innerRadius * 0.3, 0, Math.PI * 2)
      ctx.fill()

      // Draw screw head detail (cross pattern)
      ctx.strokeStyle = '#64748b'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(-innerRadius * 0.25, 0)
      ctx.lineTo(innerRadius * 0.25, 0)
      ctx.moveTo(0, -innerRadius * 0.25)
      ctx.lineTo(0, innerRadius * 0.25)
      ctx.stroke()

      // Add gear-like texture to hub edge
      ctx.strokeStyle = '#475569'
      ctx.lineWidth = 1
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2
        const outerR = innerRadius * 0.65
        const innerR = innerRadius * 0.55
        ctx.beginPath()
        ctx.moveTo(Math.cos(angle) * outerR, Math.sin(angle) * outerR)
        ctx.lineTo(Math.cos(angle) * innerR, Math.sin(angle) * innerR)
        ctx.stroke()
      }

      ctx.restore()

      // Draw fixed outer bezel (stationary part of the safe)
      const bezelThickness = size * 0.06
      const bezelGradient = ctx.createLinearGradient(
        centerX - dialRadius - bezelThickness,
        centerY,
        centerX + dialRadius + bezelThickness,
        centerY,
      )
      bezelGradient.addColorStop(0, '#1e293b')
      bezelGradient.addColorStop(0.5, '#334155')
      bezelGradient.addColorStop(1, '#1e293b')
      ctx.fillStyle = bezelGradient
      ctx.beginPath()
      ctx.arc(centerX, centerY, dialRadius + bezelThickness, 0, Math.PI * 2)
      ctx.arc(centerX, centerY, dialRadius, 0, Math.PI * 2, true)
      ctx.fill()

      // Bezel edge highlight
      ctx.strokeStyle = '#64748b'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(centerX, centerY, dialRadius + bezelThickness, 0, Math.PI * 2)
      ctx.stroke()

      // Draw fixed indicator notch at the top (points to active number)
      const indicatorAngle = -Math.PI / 2 // Top of the dial (12 o'clock)
      const indicatorX =
        centerX + Math.cos(indicatorAngle) * (dialRadius + bezelThickness * 0.3)
      const indicatorY =
        centerY + Math.sin(indicatorAngle) * (dialRadius + bezelThickness * 0.3)

      // Highlight the indicator notch
      const isAtZero = currentStepData.isZero

      // Draw vertical indicator line (fixed, part of bezel)
      // Vertical line pointing down from the top
      ctx.strokeStyle = isAtZero ? '#ef4444' : '#22d3ee'
      ctx.lineWidth = 4
      const lineLength = size * 0.04
      ctx.beginPath()
      ctx.moveTo(indicatorX, indicatorY)
      ctx.lineTo(indicatorX, indicatorY + lineLength)
      ctx.stroke()

      // Add a small triangular pointer at the bottom of the line
      const pointerSize = size * 0.015
      ctx.fillStyle = isAtZero ? '#ef4444' : '#22d3ee'
      ctx.beginPath()
      ctx.moveTo(indicatorX, indicatorY + lineLength)
      ctx.lineTo(
        indicatorX - pointerSize,
        indicatorY + lineLength + pointerSize,
      )
      ctx.lineTo(
        indicatorX + pointerSize,
        indicatorY + lineLength + pointerSize,
      )
      ctx.closePath()
      ctx.fill()
    },
    [steps, rotations],
  )

  // Animation loop for smooth dial rotation
  useEffect(() => {
    let animationId: number

    const animate = () => {
      if (currentStep < steps.length) {
        const targetDial = steps[currentStep]?.dialPosition ?? 50
        targetDialRef.current = targetDial

        // Smooth interpolation towards target
        const diff = targetDial - animatedDialRef.current
        // Handle wrap-around (e.g., going from 99 to 0 or vice versa)
        let adjustedDiff = diff
        if (Math.abs(diff) > 50) {
          adjustedDiff = diff > 0 ? diff - 100 : diff + 100
        }

        // Smooth interpolation (ease-out)
        animatedDialRef.current += adjustedDiff * 0.15
        if (Math.abs(adjustedDiff) < 0.1) {
          animatedDialRef.current = targetDial
        }

        // Normalize to 0-99 range
        if (animatedDialRef.current < 0) {
          animatedDialRef.current += 100
        }
        if (animatedDialRef.current >= 100) {
          animatedDialRef.current -= 100
        }

        drawDial(currentStep, animatedDialRef.current)
        animationId = requestAnimationFrame(animate)
      }
    }

    animationId = requestAnimationFrame(animate)

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [currentStep, drawDial, steps.length])

  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      return
    }

    const clickInterval = 1000 / speed
    let lastTime = performance.now()

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTime

      if (deltaTime >= clickInterval) {
        setCurrentStep((prev) => {
          const next = prev + 1
          if (next >= steps.length) {
            setIsPlaying(false)
            return prev
          }
          return next
        })
        lastTime = currentTime
      }

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isPlaying, speed, steps.length])

  const handlePlayPause = () => {
    if (currentStep >= steps.length - 1) {
      setCurrentStep(0)
    }
    setIsPlaying(!isPlaying)
  }

  const handleReset = () => {
    setIsPlaying(false)
    setCurrentStep(0)
  }

  const handleStepChange = (delta: number) => {
    setCurrentStep((prev) => {
      const next = prev + delta
      if (next < 0) return 0
      if (next >= steps.length) return steps.length - 1
      return next
    })
  }

  const currentCount =
    part === 1
      ? steps
          .slice(0, currentStep + 1)
          .filter((s) => s.isEndOfRotation && s.isZero).length
      : steps.slice(0, currentStep + 1).filter((s) => s.isZero).length

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
        <div className="flex flex-col gap-4 mb-4">
          <div className="flex items-center gap-4 flex-wrap">
            <label className="text-white text-sm font-medium">
              Part: {part}
            </label>
            <ButtonGroup>
              <Button
                variant={part === 1 ? 'default' : 'secondary'}
                onClick={() => setPart(1)}
              >
                Part 1
              </Button>
              <Button
                variant={part === 2 ? 'default' : 'secondary'}
                onClick={() => setPart(2)}
              >
                Part 2
              </Button>
            </ButtonGroup>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <label className="text-white text-sm font-medium">
              Speed: {speed} clicks/sec
            </label>
            <input
              type="range"
              min="1"
              max="100"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="flex-1 max-w-xs"
            />
          </div>

          <div className="text-white text-sm space-y-1">
            <div>
              Step: {currentStep + 1} / {steps.length}
            </div>
            <div>
              Current Count:{' '}
              <span className="text-cyan-400">{currentCount}</span> /{' '}
              <span className="text-slate-400">
                {part === 1 ? part1Count : part2Count} (final)
              </span>
            </div>
            <div className="text-slate-400 text-xs">
              Part 1: Count when dial ends at 0 after a rotation ({part1Count})
            </div>
            <div className="text-slate-400 text-xs">
              Part 2: Count every time dial points at 0 during rotations (
              {part2Count})
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <ButtonGroup>
            <Button variant="default" onClick={handlePlayPause}>
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            <Button variant="default" onClick={handleReset}>
              Reset
            </Button>
            <Button
              variant="default"
              onClick={() => handleStepChange(-1)}
              disabled={currentStep === 0}
            >
              ← Prev
            </Button>
            <Button
              variant="default"
              onClick={() => handleStepChange(1)}
              disabled={currentStep >= steps.length - 1}
            >
              Next →
            </Button>
          </ButtonGroup>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="flex justify-center bg-slate-900/50 rounded-lg p-4 overflow-auto">
            <canvas
              ref={canvasRef}
              className="border border-slate-700 rounded"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </div>

          {/* Text display below canvas for proper centering */}
          <div className="text-center space-y-2">
            {currentStep < steps.length && steps[currentStep] && (
              <>
                <div className="text-white">
                  <div
                    className={`text-6xl font-bold ${
                      steps[currentStep].isZero ? 'text-red-500' : 'text-white'
                    }`}
                  >
                    {steps[currentStep].dialPosition
                      .toString()
                      .padStart(2, '0')}
                  </div>
                  <div
                    className={`text-lg mt-1 ${
                      steps[currentStep].isZero
                        ? 'text-red-400'
                        : 'text-cyan-400'
                    }`}
                  >
                    Active
                  </div>
                </div>
                <div className="text-slate-400 text-sm space-y-1">
                  <div>
                    Rotation {steps[currentStep].rotationIndex + 1}/
                    {rotations.length}:{' '}
                    {rotations[steps[currentStep].rotationIndex]?.direction}
                    {rotations[steps[currentStep].rotationIndex]?.distance}
                  </div>
                  <div>
                    Step {steps[currentStep].stepIndex}/
                    {rotations[steps[currentStep].rotationIndex]?.distance}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
