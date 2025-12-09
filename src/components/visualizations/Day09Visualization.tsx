import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'

type Point = { x: number; y: number }

type Edge = {
  x1: number
  y1: number
  x2: number
  y2: number
  vertical: boolean
  minX: number
  maxX: number
  minY: number
  maxY: number
}

type Rectangle = {
  area: number
  first: Point
  second: Point
}

type Frame = {
  step: number
  currentRect: { a: Point; b: Point; area: number } | null
  bestRect: Rectangle | null
  isValid: boolean | null
  comparisons: number
  validations: number
}

const EPSILON = 1e-9

function parsePoints(input: string): Array<Point> {
  if (!input.trim()) {
    return []
  }

  return input
    .trim()
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line, idx) => {
      const [xStr, yStr] = line.split(',').map((value) => value.trim())
      if (!xStr || !yStr) {
        throw new Error(`Invalid coordinate on line ${idx + 1}: "${line}"`)
      }
      const x = Number(xStr)
      const y = Number(yStr)
      if (Number.isNaN(x) || Number.isNaN(y)) {
        throw new Error(`Invalid numeric value on line ${idx + 1}: "${line}"`)
      }
      return { x, y }
    })
}

function inclusiveArea(a: Point, b: Point): number {
  const width = Math.abs(a.x - b.x) + 1
  const height = Math.abs(a.y - b.y) + 1
  return width * height
}

function buildEdges(points: Array<Point>): Array<Edge> {
  if (points.length < 2) {
    return []
  }
  const edges: Array<Edge> = []
  for (let i = 0; i < points.length; i++) {
    const a = points[i]
    const b = points[(i + 1) % points.length]
    if (a.x !== b.x && a.y !== b.y) {
      throw new Error(
        `Invalid polygon: consecutive points are not aligned (${a.x},${a.y}) -> (${b.x},${b.y})`,
      )
    }
    const vertical = a.x === b.x
    const edge: Edge = {
      x1: a.x,
      y1: a.y,
      x2: b.x,
      y2: b.y,
      vertical,
      minX: Math.min(a.x, b.x),
      maxX: Math.max(a.x, b.x),
      minY: Math.min(a.y, b.y),
      maxY: Math.max(a.y, b.y),
    }
    edges.push(edge)
  }
  return edges
}

function isPointOnSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): boolean {
  if (Math.abs(ax - bx) < EPSILON) {
    if (Math.abs(px - ax) > EPSILON) {
      return false
    }
    return py + EPSILON >= Math.min(ay, by) && py - EPSILON <= Math.max(ay, by)
  }
  if (Math.abs(ay - by) < EPSILON) {
    if (Math.abs(py - ay) > EPSILON) {
      return false
    }
    return px + EPSILON >= Math.min(ax, bx) && px - EPSILON <= Math.max(ax, bx)
  }
  return false
}

function pointInPolygon(point: Point, polygon: Array<Point>): boolean {
  const { x: px, y: py } = point
  let inside = false

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x
    const yi = polygon[i].y
    const xj = polygon[j].x
    const yj = polygon[j].y

    if (isPointOnSegment(px, py, xi, yi, xj, yj)) {
      return true
    }

    if (Math.abs(yj - yi) < EPSILON) {
      continue
    }

    const intersects =
      yi > py !== yj > py &&
      px < ((xj - xi) * (py - yi)) / (yj - yi + Number.EPSILON) + xi + EPSILON

    if (intersects) {
      inside = !inside
    }
  }

  return inside
}

function rectangleIntersectsBoundary(
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
  edges: Array<Edge>,
): boolean {
  for (const edge of edges) {
    if (edge.vertical) {
      if (edge.x1 <= xMin || edge.x1 >= xMax) {
        continue
      }
      const overlap = Math.min(edge.maxY, yMax) - Math.max(edge.minY, yMin)
      if (overlap > 0) {
        return true
      }
    } else {
      if (edge.y1 <= yMin || edge.y1 >= yMax) {
        continue
      }
      const overlap = Math.min(edge.maxX, xMax) - Math.max(edge.minX, xMin)
      if (overlap > 0) {
        return true
      }
    }
  }
  return false
}

function isRectangleValid(
  a: Point,
  b: Point,
  polygon: Array<Point>,
  edges: Array<Edge>,
): boolean {
  const xMin = Math.min(a.x, b.x)
  const xMax = Math.max(a.x, b.x)
  const yMin = Math.min(a.y, b.y)
  const yMax = Math.max(a.y, b.y)

  if (xMin === xMax && yMin === yMax) {
    return false
  }

  if (rectangleIntersectsBoundary(xMin, xMax, yMin, yMax, edges)) {
    return false
  }

  const sampleX = xMin === xMax ? xMin : (xMin + xMax) / 2
  const sampleY = yMin === yMax ? yMin : (yMin + yMax) / 2

  return pointInPolygon({ x: sampleX, y: sampleY }, polygon)
}

function generateFrames(
  input: string,
  part: 1 | 2,
): { frames: Array<Frame>; finalBest: Rectangle | null } {
  const points = parsePoints(input)
  if (points.length < 2) {
    return { frames: [], finalBest: null }
  }

  const edges = buildEdges(points)
  const frames: Array<Frame> = []
  let bestAny: Rectangle | null = null
  let bestRestricted: Rectangle | null = null
  let comparisons = 0
  let validations = 0
  let step = 0

  // Initial frame
  frames.push({
    step: 0,
    currentRect: null,
    bestRect: null,
    isValid: null,
    comparisons: 0,
    validations: 0,
  })

  for (let i = 0; i < points.length; i++) {
    const pointA = points[i]
    for (let j = i + 1; j < points.length; j++) {
      const pointB = points[j]
      const area = inclusiveArea(pointA, pointB)
      comparisons += 1
      step += 1

      let isValid: boolean | null = null

      if (!bestAny || area > bestAny.area) {
        bestAny = { area, first: pointA, second: pointB }
      }

      if (part === 2) {
        if (bestRestricted && area <= bestRestricted.area) {
          // Skip validation if area is too small
          frames.push({
            step,
            currentRect: { a: pointA, b: pointB, area },
            bestRect: bestRestricted,
            isValid: false,
            comparisons,
            validations,
          })
          continue
        }

        validations += 1
        isValid = isRectangleValid(pointA, pointB, points, edges)
        if (isValid) {
          bestRestricted = { area, first: pointA, second: pointB }
        }
      }

      frames.push({
        step,
        currentRect: { a: pointA, b: pointB, area },
        bestRect: part === 1 ? bestAny : bestRestricted,
        isValid,
        comparisons,
        validations,
      })
    }
  }

  return {
    frames,
    finalBest: part === 1 ? bestAny : bestRestricted,
  }
}

export function Day09Visualization({ input }: { input: string }) {
  const [speed, setSpeed] = useState(10) // steps per second
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentFrame, setCurrentFrame] = useState(0)
  const [part, setPart] = useState<1 | 2>(1)
  const [frames, setFrames] = useState<Array<Frame>>([])
  const [finalBest, setFinalBest] = useState<Rectangle | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>(0)
  const pointsRef = useRef<Array<Point>>([])
  const edgesRef = useRef<Array<Edge>>([])

  // Parse input and generate frames
  useEffect(() => {
    const points = parsePoints(input)
    pointsRef.current = points
    const edges = buildEdges(points)
    edgesRef.current = edges

    const { frames: generatedFrames, finalBest: best } = generateFrames(
      input,
      part,
    )
    setFrames(generatedFrames)
    setFinalBest(best)
    setCurrentFrame(0)
  }, [input, part])

  const drawFrame = useCallback(
    (frameIndex: number) => {
      const canvas = canvasRef.current
      if (!canvas || frameIndex >= frames.length) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const frame = frames[frameIndex]
      const points = pointsRef.current

      if (points.length === 0) return

      // Calculate bounds
      let minX = Infinity,
        maxX = -Infinity
      let minY = Infinity,
        maxY = -Infinity

      points.forEach((p) => {
        minX = Math.min(minX, p.x)
        maxX = Math.max(maxX, p.x)
        minY = Math.min(minY, p.y)
        maxY = Math.max(maxY, p.y)
      })

      // Add padding
      const padding = 50
      const rangeX = maxX - minX || 1
      const rangeY = maxY - minY || 1
      const scale = Math.min(
        (window.innerWidth * 0.8) / (rangeX + padding * 2),
        (window.innerHeight * 0.6) / (rangeY + padding * 2),
        20, // Max scale
      )

      const canvasWidth = (rangeX + padding * 2) * scale
      const canvasHeight = (rangeY + padding * 2) * scale

      canvas.width = canvasWidth
      canvas.height = canvasHeight

      // Clear canvas
      ctx.fillStyle = '#0f172a'
      ctx.fillRect(0, 0, canvasWidth, canvasHeight)

      // Transform to center and scale
      ctx.save()
      ctx.translate(padding * scale, padding * scale)
      ctx.scale(scale, scale)
      ctx.translate(-minX, -minY)

      // Draw polygon fill (light background)
      ctx.fillStyle = '#1e293b'
      ctx.beginPath()
      ctx.moveTo(points[0].x, points[0].y)
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y)
      }
      ctx.closePath()
      ctx.fill()

      // Draw polygon outline
      ctx.strokeStyle = '#64748b'
      ctx.lineWidth = 2 / scale
      ctx.beginPath()
      ctx.moveTo(points[0].x, points[0].y)
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y)
      }
      ctx.closePath()
      ctx.stroke()

      // Draw polygon vertices
      ctx.fillStyle = '#22d3ee'
      points.forEach((p) => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, 3 / scale, 0, Math.PI * 2)
        ctx.fill()
      })

      // Draw best rectangle (if exists)
      if (frame.bestRect) {
        const { first, second } = frame.bestRect
        const xMin = Math.min(first.x, second.x)
        const xMax = Math.max(first.x, second.x)
        const yMin = Math.min(first.y, second.y)
        const yMax = Math.max(first.y, second.y)

        if (part === 2) {
          // Draw individual green tiles for best valid rectangle in part 2
          ctx.fillStyle = '#22c55e' // green
          ctx.strokeStyle = '#16a34a' // darker green for borders
          ctx.lineWidth = 0.5 / scale

          // Draw each tile in the rectangle
          for (let x = xMin; x <= xMax; x++) {
            for (let y = yMin; y <= yMax; y++) {
              ctx.fillRect(x, y, 1, 1)
              ctx.strokeRect(x, y, 1, 1)
            }
          }

          // Draw rectangle outline
          ctx.strokeStyle = '#22c55e'
          ctx.lineWidth = 3 / scale
          ctx.strokeRect(xMin, yMin, xMax - xMin + 1, yMax - yMin + 1)
        } else {
          // Part 1: cyan highlight
          ctx.fillStyle = 'rgba(34, 211, 238, 0.3)' // cyan with transparency
          ctx.strokeStyle = '#22d3ee'
          ctx.lineWidth = 3 / scale
          ctx.fillRect(xMin, yMin, xMax - xMin + 1, yMax - yMin + 1)
          ctx.strokeRect(xMin, yMin, xMax - xMin + 1, yMax - yMin + 1)
        }

        // Draw corner points
        ctx.fillStyle = part === 2 ? '#16a34a' : '#22d3ee'
        ctx.beginPath()
        ctx.arc(first.x, first.y, 4 / scale, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(second.x, second.y, 4 / scale, 0, Math.PI * 2)
        ctx.fill()
      }

      // Draw current rectangle being tested
      if (frame.currentRect) {
        const { a, b, area } = frame.currentRect
        const xMin = Math.min(a.x, b.x)
        const xMax = Math.max(a.x, b.x)
        const yMin = Math.min(a.y, b.y)
        const yMax = Math.max(a.y, b.y)

        // Color based on validity
        if (part === 2) {
          if (frame.isValid === true) {
            // Draw individual green tiles for valid rectangles
            ctx.fillStyle = '#22c55e' // green
            ctx.strokeStyle = '#16a34a' // darker green for borders
            ctx.lineWidth = 0.5 / scale

            // Draw each tile in the rectangle
            for (let x = xMin; x <= xMax; x++) {
              for (let y = yMin; y <= yMax; y++) {
                ctx.fillRect(x, y, 1, 1)
                ctx.strokeRect(x, y, 1, 1)
              }
            }

            // Draw rectangle outline
            ctx.strokeStyle = '#22c55e'
            ctx.lineWidth = 2 / scale
            ctx.strokeRect(xMin, yMin, xMax - xMin + 1, yMax - yMin + 1)
          } else if (frame.isValid === false) {
            ctx.fillStyle = 'rgba(239, 68, 68, 0.2)' // red
            ctx.strokeStyle = '#ef4444'
            ctx.lineWidth = 2 / scale
            ctx.fillRect(xMin, yMin, xMax - xMin + 1, yMax - yMin + 1)
            ctx.strokeRect(xMin, yMin, xMax - xMin + 1, yMax - yMin + 1)
          } else {
            ctx.fillStyle = 'rgba(251, 191, 36, 0.2)' // yellow
            ctx.strokeStyle = '#fbbf24'
            ctx.lineWidth = 2 / scale
            ctx.fillRect(xMin, yMin, xMax - xMin + 1, yMax - yMin + 1)
            ctx.strokeRect(xMin, yMin, xMax - xMin + 1, yMax - yMin + 1)
          }
        } else {
          ctx.fillStyle = 'rgba(251, 191, 36, 0.2)' // yellow
          ctx.strokeStyle = '#fbbf24'
          ctx.lineWidth = 2 / scale
          ctx.fillRect(xMin, yMin, xMax - xMin + 1, yMax - yMin + 1)
          ctx.strokeRect(xMin, yMin, xMax - xMin + 1, yMax - yMin + 1)
        }

        // Draw corner points
        ctx.fillStyle =
          part === 2 && frame.isValid === true ? '#16a34a' : '#fbbf24'
        ctx.beginPath()
        ctx.arc(a.x, a.y, 3 / scale, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(b.x, b.y, 3 / scale, 0, Math.PI * 2)
        ctx.fill()

        // Draw area label
        ctx.fillStyle = '#ffffff'
        ctx.font = `${12 / scale}px monospace`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(`Area: ${area}`, (xMin + xMax) / 2, (yMin + yMax) / 2)
      }

      ctx.restore()
    },
    [frames, part],
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

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
        <div className="flex flex-col gap-4 mb-4">
          <div className="flex items-center gap-4 flex-wrap">
            <label className="text-white text-sm font-medium">Part:</label>
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
              Speed: {speed} steps/sec
            </label>
            <input
              type="range"
              min="1"
              max="5000"
              step="1"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="flex-1 max-w-xs"
            />
          </div>

          <div className="text-white text-sm space-y-1">
            <div>
              Step: {currentFrame + 1} / {frames.length}
            </div>
            {currentFrame < frames.length && frames[currentFrame] && (
              <>
                <div>
                  Comparisons: {frames[currentFrame].comparisons} | Validations:{' '}
                  {frames[currentFrame].validations}
                </div>
                {frames[currentFrame].currentRect && (
                  <div>
                    Current Area:{' '}
                    <span className="text-cyan-400">
                      {frames[currentFrame].currentRect.area}
                    </span>
                  </div>
                )}
                {frames[currentFrame].bestRect && (
                  <div>
                    Best Area:{' '}
                    <span className="text-green-400">
                      {frames[currentFrame].bestRect.area}
                    </span>
                  </div>
                )}
                {part === 2 && frames[currentFrame].isValid !== null && (
                  <div>
                    Valid:{' '}
                    <span
                      className={
                        frames[currentFrame].isValid
                          ? 'text-green-400'
                          : 'text-red-400'
                      }
                    >
                      {frames[currentFrame].isValid ? 'Yes' : 'No'}
                    </span>
                  </div>
                )}
              </>
            )}
            {finalBest && (
              <div className="text-slate-400 text-xs mt-2">
                Final Answer (Part {part}): {finalBest.area}
              </div>
            )}
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
                className="w-4 h-4 rounded border-2"
                style={{
                  borderColor: '#64748b',
                  backgroundColor: 'transparent',
                }}
              />
              <span>Polygon Outline</span>
            </div>
            {part === 1 && (
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: '#22d3ee' }}
                />
                <span>Best Rectangle (Cyan)</span>
              </div>
            )}
            {part === 2 && (
              <>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: '#22c55e' }}
                  />
                  <span>Best Valid Rectangle (Green Tiles)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded border-2"
                    style={{
                      borderColor: '#22c55e',
                      backgroundColor: '#22c55e',
                    }}
                  />
                  <span>Valid Rectangle (Green Tiles)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded border-2"
                    style={{
                      borderColor: '#ef4444',
                      backgroundColor: 'rgba(239, 68, 68, 0.2)',
                    }}
                  />
                  <span>Invalid Rectangle (Red)</span>
                </div>
              </>
            )}
            {part === 1 && (
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded border-2"
                  style={{
                    borderColor: '#fbbf24',
                    backgroundColor: 'rgba(251, 191, 36, 0.2)',
                  }}
                />
                <span>Current Rectangle (Yellow)</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
