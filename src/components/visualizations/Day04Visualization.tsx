import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'

interface GridState {
  grid: Array<Array<string>>
  accessibleRolls: Array<{ row: number; col: number }>
  removedRolls: Array<{ row: number; col: number }>
  iteration: number
  totalRemoved: number
}

const getSurroundingRolls = (
  grid: Array<Array<string>>,
  row: number,
  col: number,
): number => {
  const directions = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
  ]

  let surroundingRolls = 0
  for (const [dr, dc] of directions) {
    const newRow = row + dr
    const newCol = col + dc

    if (
      newRow >= 0 &&
      newRow < grid.length &&
      newCol >= 0 &&
      newCol < grid[0].length &&
      grid[newRow][newCol] === '@'
    ) {
      surroundingRolls++
    }
  }
  return surroundingRolls
}

function generateFrames(input: string): Array<GridState> {
  const initialGrid = input
    .trim()
    .split('\n')
    .filter((line) => line.length > 0)
    .map((line) => line.split(''))

  const frames: Array<GridState> = []

  // Deep copy for working grid
  const workingGrid = initialGrid.map((row) => [...row])
  let totalRemoved = 0
  let iteration = 0

  // Initial frame - show all rolls
  frames.push({
    grid: initialGrid.map((row) => [...row]),
    accessibleRolls: [],
    removedRolls: [],
    iteration: 0,
    totalRemoved: 0,
  })

  // Part 1: First pass - find accessible rolls
  const part1Accessible: Array<{ row: number; col: number }> = []
  for (let row = 0; row < workingGrid.length; row++) {
    for (let col = 0; col < workingGrid[row].length; col++) {
      if (workingGrid[row][col] === '@') {
        const surroundingRolls = getSurroundingRolls(workingGrid, row, col)
        if (surroundingRolls < 4) {
          part1Accessible.push({ row, col })
        }
      }
    }
  }

  // Frame: Show accessible rolls (highlighted)
  if (part1Accessible.length > 0) {
    frames.push({
      grid: initialGrid.map((row) => [...row]),
      accessibleRolls: part1Accessible,
      removedRolls: [],
      iteration: 1,
      totalRemoved: 0,
    })
  }

  // Remove part 1 rolls
  for (const { row, col } of part1Accessible) {
    workingGrid[row][col] = '.'
    totalRemoved++
  }

  // Frame: Show removed rolls
  if (part1Accessible.length > 0) {
    frames.push({
      grid: workingGrid.map((row) => [...row]),
      accessibleRolls: [],
      removedRolls: part1Accessible,
      iteration: 1,
      totalRemoved,
    })
  }

  // Part 2: Iterative removal
  iteration = 2
  let rollsRemovedThisIteration = part1Accessible.length

  while (rollsRemovedThisIteration > 0) {
    rollsRemovedThisIteration = 0
    const accessibleThisIteration: Array<{ row: number; col: number }> = []

    // Find accessible rolls in current state
    for (let row = 0; row < workingGrid.length; row++) {
      for (let col = 0; col < workingGrid[row].length; col++) {
        if (workingGrid[row][col] === '@') {
          const surroundingRolls = getSurroundingRolls(workingGrid, row, col)
          if (surroundingRolls < 4) {
            accessibleThisIteration.push({ row, col })
            rollsRemovedThisIteration++
          }
        }
      }
    }

    // Frame: Show accessible rolls for this iteration (highlighted)
    if (accessibleThisIteration.length > 0) {
      frames.push({
        grid: workingGrid.map((row) => [...row]),
        accessibleRolls: accessibleThisIteration,
        removedRolls: [],
        iteration,
        totalRemoved,
      })
    }

    // Remove accessible rolls
    for (const { row, col } of accessibleThisIteration) {
      workingGrid[row][col] = '.'
      totalRemoved++
    }

    // Frame: Show removed rolls
    if (accessibleThisIteration.length > 0) {
      frames.push({
        grid: workingGrid.map((row) => [...row]),
        accessibleRolls: [],
        removedRolls: accessibleThisIteration,
        iteration,
        totalRemoved,
      })
    }

    iteration++
  }

  return frames
}

export function Day04Visualization({ input }: { input: string }) {
  const [speed, setSpeed] = useState(2) // iterations per second
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentFrame, setCurrentFrame] = useState(0)
  const [frames, setFrames] = useState<Array<GridState>>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>(0)

  // Parse input and generate frames
  useEffect(() => {
    const generatedFrames = generateFrames(input)
    setFrames(generatedFrames)
    setCurrentFrame(0)
  }, [input])

  const drawFrame = useCallback(
    (frameIndex: number) => {
      const canvas = canvasRef.current
      if (!canvas || frameIndex >= frames.length) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const frame = frames[frameIndex]
      const grid = frame.grid
      const rows = grid.length
      const cols = grid[0]?.length || 0

      // Calculate cell size to fit in viewport
      const maxWidth = Math.min(1200, window.innerWidth * 0.9)
      const maxHeight = Math.min(800, window.innerHeight * 0.7)
      const cellSize = Math.min(
        Math.floor(maxWidth / cols),
        Math.floor(maxHeight / rows),
        20, // Max cell size
      )

      const canvasWidth = cols * cellSize
      const canvasHeight = rows * cellSize

      canvas.width = canvasWidth
      canvas.height = canvasHeight

      // Clear canvas
      ctx.fillStyle = '#0f172a'
      ctx.fillRect(0, 0, canvasWidth, canvasHeight)

      // Draw grid
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = col * cellSize
          const y = row * cellSize
          const cell = grid[row][col]

          // Check if this cell is accessible (highlighted)
          const isAccessible = frame.accessibleRolls.some(
            (r) => r.row === row && r.col === col,
          )
          // Check if this cell was just removed
          const isRemoved = frame.removedRolls.some(
            (r) => r.row === row && r.col === col,
          )

          if (cell === '@' && !isRemoved) {
            // Roll of paper
            if (isAccessible) {
              // Highlight accessible rolls with a glow effect
              ctx.fillStyle = '#fbbf24' // Yellow/gold for accessible
              ctx.shadowColor = '#fbbf24'
              ctx.shadowBlur = cellSize * 0.5
            } else {
              ctx.fillStyle = '#64748b' // Gray for regular rolls
              ctx.shadowBlur = 0
            }
            ctx.fillRect(x, y, cellSize, cellSize)

            // Draw @ symbol
            ctx.fillStyle = '#1e293b'
            ctx.font = `bold ${cellSize * 0.6}px monospace`
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.shadowBlur = 0
            ctx.fillText('@', x + cellSize / 2, y + cellSize / 2)
          } else if (cell === '.' || isRemoved) {
            // Empty space or removed roll
            if (isRemoved) {
              // Show removed rolls with an X
              ctx.fillStyle = '#ef4444' // Red for removed
              ctx.fillRect(x, y, cellSize, cellSize)

              // Draw X symbol
              ctx.strokeStyle = '#1e293b'
              ctx.lineWidth = Math.max(2, cellSize * 0.15)
              ctx.beginPath()
              ctx.moveTo(x + cellSize * 0.2, y + cellSize * 0.2)
              ctx.lineTo(x + cellSize * 0.8, y + cellSize * 0.8)
              ctx.moveTo(x + cellSize * 0.8, y + cellSize * 0.2)
              ctx.lineTo(x + cellSize * 0.2, y + cellSize * 0.8)
              ctx.stroke()
            } else {
              // Empty space
              ctx.fillStyle = '#1e293b'
              ctx.fillRect(x, y, cellSize, cellSize)
            }
          }

          // Draw grid lines
          ctx.strokeStyle = '#334155'
          ctx.lineWidth = 0.5
          ctx.strokeRect(x, y, cellSize, cellSize)
        }
      }
    },
    [frames],
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

    const frameInterval = 1000 / speed
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
  }, [isPlaying, speed, frames.length])

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

  // Calculate counts (Part 2 subsumes Part 1)
  const totalRemoved =
    frames.length > 0 ? frames[frames.length - 1]?.totalRemoved || 0 : 0
  const currentCount =
    currentFrame < frames.length ? frames[currentFrame]?.totalRemoved || 0 : 0

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
        <div className="flex flex-col gap-4 mb-4">
          <div className="flex items-center gap-4 flex-wrap">
            <label className="text-white text-sm font-medium">
              Speed: {speed} iterations/sec
            </label>
            <input
              type="range"
              min="0.5"
              max="10"
              step="0.5"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="flex-1 max-w-xs"
            />
          </div>

          <div className="text-white text-sm space-y-1">
            <div>
              Frame: {currentFrame + 1} / {frames.length}
            </div>
            <div>
              Current Count:{' '}
              <span className="text-cyan-400">{currentCount}</span> /{' '}
              <span className="text-slate-400">{totalRemoved} (final)</span>
            </div>
            {currentFrame < frames.length && frames[currentFrame] && (
              <div className="text-slate-400 text-xs">
                Iteration: {frames[currentFrame].iteration} | Accessible:{' '}
                {frames[currentFrame].accessibleRolls.length} | Removed:{' '}
                {frames[currentFrame].removedRolls.length}
              </div>
            )}
            <div className="text-slate-400 text-xs">
              Total rolls removed after iterative process (includes Part 1)
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
              onClick={() => handleFrameChange(-1)}
              disabled={currentFrame === 0}
            >
              ← Prev
            </Button>
            <Button
              variant="default"
              onClick={() => handleFrameChange(1)}
              disabled={currentFrame >= frames.length - 1}
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

          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-sm text-white">
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: '#64748b' }}
              />
              <span>Roll (@)</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: '#fbbf24' }}
              />
              <span>Accessible (highlighted)</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: '#ef4444' }}
              />
              <span>Removed (X)</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: '#1e293b' }}
              />
              <span>Empty (.)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
