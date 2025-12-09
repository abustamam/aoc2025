import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'

interface BeamState {
  row: number
  col: number
}

interface Frame {
  beams: Set<number>
  row: number
}

function findEmitter(lines: Array<string>): { row: number; col: number } {
  for (let row = 0; row < lines.length; row++) {
    const col = lines[row].indexOf('S')
    if (col !== -1) {
      return { row, col }
    }
  }
  throw new Error('No emitter "S" found in input')
}

function simulateFrames(
  lines: Array<string>,
  startRow: number,
  startCol: number,
): Array<Frame> {
  const frames: Array<Frame> = []
  let activeBeams = new Set<number>([startCol])

  for (let row = startRow; row < lines.length && activeBeams.size > 0; row++) {
    const line = lines[row]
    const nextBeams = new Set<number>()

    frames.push({
      beams: new Set(activeBeams),
      row,
    })

    for (const col of activeBeams) {
      if (col < 0 || col >= line.length) continue
      const cell = line[col]

      if (cell === '^') {
        if (col - 1 >= 0) nextBeams.add(col - 1)
        if (col + 1 < line.length) nextBeams.add(col + 1)
      } else {
        nextBeams.add(col)
      }
    }

    activeBeams = nextBeams
  }

  return frames
}

export function Day07Visualization({ input }: { input: string }) {
  const [fps, setFps] = useState(2)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentFrame, setCurrentFrame] = useState(0)
  const [frames, setFrames] = useState<Array<Frame>>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>(0)
  const lastFrameTimeRef = useRef<number>(0)

  const lines = input
    .trim()
    .split('\n')
    .filter((line) => line.length > 0)

  useEffect(() => {
    const { row: startRow, col: startCol } = findEmitter(lines)
    const simulatedFrames = simulateFrames(lines, startRow, startCol)
    setFrames(simulatedFrames)
    setCurrentFrame(0)
  }, [input])

  const drawFrame = useCallback(
    (frameIndex: number) => {
      const canvas = canvasRef.current
      if (!canvas || frameIndex >= frames.length) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const cellSize = Math.max(
        4,
        Math.min(8, Math.floor(800 / lines[0]?.length || 1)),
      )
      const canvasWidth = (lines[0]?.length || 0) * cellSize
      const canvasHeight = lines.length * cellSize

      canvas.width = canvasWidth
      canvas.height = canvasHeight

      ctx.fillStyle = '#0f172a'
      ctx.fillRect(0, 0, canvasWidth, canvasHeight)

      const frame = frames[frameIndex]

      // Draw the grid
      for (let row = 0; row < lines.length; row++) {
        const line = lines[row]
        for (let col = 0; col < line.length; col++) {
          const cell = line[col]
          const x = col * cellSize
          const y = row * cellSize

          if (cell === 'S') {
            ctx.fillStyle = '#fbbf24'
            ctx.fillRect(x, y, cellSize, cellSize)
          } else if (cell === '^') {
            ctx.fillStyle = '#ef4444'
            ctx.fillRect(x, y, cellSize, cellSize)
          } else {
            ctx.fillStyle = '#1e293b'
            ctx.fillRect(x, y, cellSize, cellSize)
          }

          // Draw grid lines
          ctx.strokeStyle = '#334155'
          ctx.lineWidth = 0.5
          ctx.strokeRect(x, y, cellSize, cellSize)
        }
      }

      // Draw beams up to the current frame
      ctx.strokeStyle = '#22d3ee'
      ctx.lineWidth = Math.max(1, cellSize * 0.3)

      for (let i = 0; i <= frameIndex; i++) {
        const f = frames[i]
        if (f.row < lines.length) {
          for (const col of f.beams) {
            if (col >= 0 && col < lines[0]?.length) {
              const x = col * cellSize + cellSize / 2
              const y = f.row * cellSize + cellSize / 2
              const nextY = (f.row + 1) * cellSize + cellSize / 2

              if (f.row < lines.length - 1) {
                ctx.beginPath()
                ctx.moveTo(x, y)
                ctx.lineTo(x, nextY)
                ctx.stroke()
              } else {
                // Draw a point at the bottom
                ctx.beginPath()
                ctx.arc(x, y, cellSize * 0.2, 0, Math.PI * 2)
                ctx.fillStyle = '#22d3ee'
                ctx.fill()
              }
            }
          }
        }
      }
    },
    [frames, lines],
  )

  useEffect(() => {
    drawFrame(currentFrame)
  }, [currentFrame, drawFrame])

  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      return
    }

    const frameInterval = 1000 / fps
    let lastTime = performance.now()

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTime

      if (deltaTime >= frameInterval) {
        setCurrentFrame((prev) => {
          const next = prev + 1
          if (next >= frames.length) {
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
  }, [isPlaying, fps, frames.length])

  const handlePlayPause = () => {
    if (currentFrame >= frames.length - 1) {
      setCurrentFrame(0)
    }
    setIsPlaying(!isPlaying)
  }

  const handleReset = () => {
    setIsPlaying(false)
    setCurrentFrame(0)
  }

  const handleFrameChange = (delta: number) => {
    setCurrentFrame((prev) => {
      const next = prev + delta
      if (next < 0) return 0
      if (next >= frames.length) return frames.length - 1
      return next
    })
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
        <div className="flex flex-col gap-4 mb-4">
          <div className="flex items-center gap-4 flex-wrap">
            <label className="text-white text-sm font-medium">FPS: {fps}</label>
            <input
              type="range"
              min="1"
              max="10"
              value={fps}
              onChange={(e) => setFps(Number(e.target.value))}
              className="flex-1 max-w-xs"
            />
          </div>
          <div className="text-white text-sm">
            Frame: {currentFrame + 1} / {frames.length}
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
              onClick={() => handleFrameChange(-1)}
              disabled={currentFrame === 0}
              className="text-white border-slate-600 hover:bg-slate-700"
            >
              ← Prev
            </Button>
            <Button
              variant="default"
              onClick={() => handleFrameChange(1)}
              disabled={currentFrame >= frames.length - 1}
              className="text-white border-slate-600 hover:bg-slate-700"
            >
              Next →
            </Button>
          </ButtonGroup>
        </div>

        <div className="flex justify-center bg-slate-900/50 rounded-lg p-4 overflow-auto">
          <canvas
            ref={canvasRef}
            className="border border-slate-700 rounded"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </div>
      </div>
    </div>
  )
}
