import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { ZoomIn, ZoomOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'

type Point3D = { x: number; y: number; z: number }

function parsePoints(input: string): Array<Point3D> {
  return input
    .trim()
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const [x, y, z] = line.split(',').map((value) => Number(value.trim()))
      return { x, y, z }
    })
}

function distance(a: Point3D, b: Point3D): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)
}

// Simple union-find implementation for circuit tracking
class SimpleCircuitManager {
  private parent: Array<number>
  private size: Array<number>

  constructor(count: number) {
    this.parent = Array.from({ length: count }, (_, index) => index)
    this.size = Array.from({ length: count }, () => 1)
  }

  private find(node: number): number {
    if (this.parent[node] !== node) {
      this.parent[node] = this.find(this.parent[node])
    }
    return this.parent[node]
  }

  union(a: number, b: number): boolean {
    let rootA = this.find(a)
    let rootB = this.find(b)

    if (rootA === rootB) {
      return false // Already in same circuit
    }

    if (this.size[rootA] < this.size[rootB]) {
      ;[rootA, rootB] = [rootB, rootA]
    }

    this.parent[rootB] = rootA
    this.size[rootA] += this.size[rootB]
    return true // Successfully merged
  }
}

function buildActualConnections(
  points: Array<Point3D>,
  maxConnections: number,
): Array<{ i: number; j: number; distance: number }> {
  // Build all pairs sorted by distance
  const pairs: Array<{ i: number; j: number; distance: number }> = []

  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const dist = distance(points[i], points[j])
      pairs.push({ i, j, distance: dist })
    }
  }

  pairs.sort((a, b) => a.distance - b.distance)

  // Use union-find to track which connections are actually made
  const circuitManager = new SimpleCircuitManager(points.length)
  const actualConnections: Array<{ i: number; j: number; distance: number }> =
    []

  for (const pair of pairs) {
    if (actualConnections.length >= maxConnections) break

    // Try to merge - if successful, this connection was actually made
    if (circuitManager.union(pair.i, pair.j)) {
      actualConnections.push(pair)
    }
  }

  return actualConnections
}

export function Day08Visualization({ input }: { input: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const animationFrameRef = useRef<number>(0)
  const [numConnections, setNumConnections] = useState(1000)
  const [showAllConnections, setShowAllConnections] = useState(false)
  const [isRotating, setIsRotating] = useState(true)
  const [connections, setConnections] = useState<
    Array<{ i: number; j: number; distance: number }>
  >([])
  const pointsRef = useRef<Array<Point3D>>([])
  const linesRef = useRef<Array<THREE.Line>>([])
  const isRotatingRef = useRef(isRotating)
  const [pointsLoaded, setPointsLoaded] = useState(false)
  const cameraDistanceRef = useRef<number>(0)
  const centerRef = useRef<{ x: number; y: number; z: number }>({
    x: 0,
    y: 0,
    z: 0,
  })
  const angleRef = useRef<number>(0)
  const maxRangeRef = useRef<number>(0)

  // Update rotating ref when state changes
  useEffect(() => {
    isRotatingRef.current = isRotating
  }, [isRotating])

  useEffect(() => {
    const points = parsePoints(input)
    pointsRef.current = points
    setPointsLoaded(points.length > 0)

    if (showAllConnections) {
      // Show all actual connections (all merged pairs)
      const maxPossible = (points.length * (points.length - 1)) / 2
      const conns = buildActualConnections(points, maxPossible)
      setConnections(conns)
    } else {
      // Show only the first N actual connections
      const conns = buildActualConnections(points, numConnections)
      setConnections(conns)
    }
  }, [input, numConnections, showAllConnections])

  // Initial Three.js setup - runs when container is ready and points are loaded
  useEffect(() => {
    if (!containerRef.current || !pointsLoaded) return
    const points = pointsRef.current
    if (points.length === 0) return
    if (sceneRef.current) return // Already initialized

    const container = containerRef.current
    const width = container.clientWidth || 800
    const height = container.clientHeight || 600

    // Create scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0f172a)
    sceneRef.current = scene

    // Create camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000000)
    cameraRef.current = camera

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    // Clear any existing canvas
    while (container.firstChild) {
      container.removeChild(container.firstChild)
    }
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Calculate bounding box

    let minX = Infinity,
      maxX = -Infinity
    let minY = Infinity,
      maxY = -Infinity
    let minZ = Infinity,
      maxZ = -Infinity

    points.forEach((p) => {
      minX = Math.min(minX, p.x)
      maxX = Math.max(maxX, p.x)
      minY = Math.min(minY, p.y)
      maxY = Math.max(maxY, p.y)
      minZ = Math.min(minZ, p.z)
      maxZ = Math.max(maxZ, p.z)
    })

    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2
    const centerZ = (minZ + maxZ) / 2

    centerRef.current = { x: centerX, y: centerY, z: centerZ }

    const rangeX = maxX - minX
    const rangeY = maxY - minY
    const rangeZ = maxZ - minZ
    const maxRange = Math.max(rangeX, rangeY, rangeZ, 1) // Ensure at least 1
    maxRangeRef.current = maxRange

    // Calculate box size relative to the data range
    // Make boxes visible but not too large
    const boxSize = Math.max(maxRange * 0.01, 100) // At least 1% of range or 100 units

    // Position camera
    const cameraDistance = maxRange * 2.5
    cameraDistanceRef.current = cameraDistance
    camera.position.set(
      centerX + cameraDistance,
      centerY + cameraDistance,
      centerZ + cameraDistance,
    )
    camera.lookAt(centerX, centerY, centerZ)

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
    scene.add(ambientLight)

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight1.position.set(
      cameraDistance,
      cameraDistance,
      cameraDistance,
    )
    scene.add(directionalLight1)

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4)
    directionalLight2.position.set(
      -cameraDistance,
      -cameraDistance,
      -cameraDistance,
    )
    scene.add(directionalLight2)

    // Create junction boxes
    const boxGeometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize)
    const boxMaterial = new THREE.MeshPhongMaterial({
      color: 0x22d3ee,
      emissive: 0x001122, // Add slight glow
    })
    const boxes: Array<THREE.Mesh> = []

    points.forEach((point) => {
      const box = new THREE.Mesh(boxGeometry, boxMaterial)
      box.position.set(point.x, point.y, point.z)
      scene.add(box)
      boxes.push(box)
    })

    // Store references for later updates
    linesRef.current = []

    // Animation loop
    const animate = () => {
      if (isRotatingRef.current) {
        angleRef.current += 0.005
      }
      const radius = cameraDistanceRef.current
      const center = centerRef.current
      camera.position.x = center.x + radius * Math.cos(angleRef.current)
      camera.position.y = center.y + radius * 0.7 // Slight elevation
      camera.position.z = center.z + radius * Math.sin(angleRef.current)
      camera.lookAt(center.x, center.y, center.z)

      renderer.render(scene, camera)
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    // Handle zoom with mousewheel
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9
      cameraDistanceRef.current = Math.max(
        maxRange * 0.5,
        Math.min(maxRange * 5, cameraDistanceRef.current * zoomFactor),
      )
    }

    // Handle resize
    const handleResize = () => {
      const newWidth = container.clientWidth
      const newHeight = Math.max(600, window.innerHeight * 0.7)
      camera.aspect = newWidth / newHeight
      camera.updateProjectionMatrix()
      renderer.setSize(newWidth, newHeight)
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    window.addEventListener('resize', handleResize)

    return () => {
      container.removeEventListener('wheel', handleWheel)
      window.removeEventListener('resize', handleResize)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      // Clean up renderer
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
      renderer.dispose()
      // Clean up geometries and materials
      boxes.forEach((box) => {
        box.geometry.dispose()
        if (box.material instanceof THREE.Material) {
          box.material.dispose()
        }
      })
      linesRef.current.forEach((line) => {
        line.geometry.dispose()
        if (line.material instanceof THREE.Material) {
          line.material.dispose()
        }
      })
      // Clean up lights
      scene.children.forEach((child) => {
        if (child instanceof THREE.Light) {
          scene.remove(child)
        }
      })
      sceneRef.current = null
    }
  }, [pointsLoaded]) // Re-run when points are loaded

  // Separate effect to update connections when they change
  useEffect(() => {
    const scene = sceneRef.current
    if (!scene || connections.length === 0) return

    const points = pointsRef.current
    if (points.length === 0) return

    // Remove old lines
    linesRef.current.forEach((line) => {
      scene.remove(line)
      line.geometry.dispose()
      if (line.material instanceof THREE.Material) {
        line.material.dispose()
      }
    })
    linesRef.current = []

    // Create line material - make it more visible
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xfbbf24,
      opacity: 1.0, // Fully opaque for better visibility
      transparent: false,
      linewidth: 3, // Thicker lines
    })

    // Add new connections
    connections.forEach(({ i, j }) => {
      const pointA = points[i]
      const pointB = points[j]

      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(pointA.x, pointA.y, pointA.z),
        new THREE.Vector3(pointB.x, pointB.y, pointB.z),
      ])

      const line = new THREE.Line(geometry, lineMaterial)
      scene.add(line)
      linesRef.current.push(line)
    })
  }, [connections])

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
        <div className="flex flex-col gap-4 mb-4">
          <div className="flex items-center gap-4 flex-wrap">
            <label className="text-white text-sm font-medium flex items-center gap-2">
              <input
                type="checkbox"
                checked={showAllConnections}
                onChange={(e) => setShowAllConnections(e.target.checked)}
                className="w-4 h-4"
              />
              Show All Circuit Connections
            </label>
            {!showAllConnections && (
              <>
                <label className="text-white text-sm font-medium">
                  First N Connections: {numConnections}
                </label>
                <input
                  type="range"
                  min="0"
                  max={Math.min(
                    5000,
                    (pointsRef.current.length *
                      (pointsRef.current.length - 1)) /
                      2,
                  )}
                  value={numConnections}
                  onChange={(e) => setNumConnections(Number(e.target.value))}
                  className="flex-1 max-w-xs"
                />
              </>
            )}
          </div>
          <div className="text-white text-sm">
            Junction Boxes: {pointsRef.current.length} | Showing{' '}
            {connections.length} actual circuit connections
            {showAllConnections && (
              <span className="text-cyan-400 ml-2">(all merged pairs)</span>
            )}
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <ButtonGroup>
            <Button
              variant="outline"
              onClick={() => setIsRotating(!isRotating)}
            >
              {isRotating ? 'Pause Rotation' : 'Start Rotation'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const maxRange = maxRangeRef.current
                if (maxRange === 0) return
                cameraDistanceRef.current = Math.max(
                  maxRange * 0.5,
                  cameraDistanceRef.current * 0.8,
                )
              }}
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const maxRange = maxRangeRef.current
                if (maxRange === 0) return
                cameraDistanceRef.current = Math.min(
                  maxRange * 5,
                  cameraDistanceRef.current * 1.2,
                )
              }}
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
          </ButtonGroup>
        </div>

        <div
          ref={containerRef}
          className="w-full bg-slate-900/50 rounded-lg overflow-hidden"
          style={{
            height: '600px',
            minHeight: '600px',
            width: '100%',
            position: 'relative',
          }}
        />
      </div>
    </div>
  )
}
