import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
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

function buildConnections(
  points: Array<Point3D>,
  maxConnections: number,
): Array<{ i: number; j: number; distance: number }> {
  const pairs: Array<{ i: number; j: number; distance: number }> = []

  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const dist = distance(points[i], points[j])
      pairs.push({ i, j, distance: dist })
    }
  }

  return pairs.sort((a, b) => a.distance - b.distance).slice(0, maxConnections)
}

export function Day08Visualization({ input }: { input: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const animationFrameRef = useRef<number>(0)
  const [numConnections, setNumConnections] = useState(1000)
  const [isRotating, setIsRotating] = useState(true)
  const [connections, setConnections] = useState<
    Array<{ i: number; j: number; distance: number }>
  >([])
  const pointsRef = useRef<Array<Point3D>>([])
  const linesRef = useRef<Array<THREE.Line>>([])
  const isRotatingRef = useRef(isRotating)
  const [pointsLoaded, setPointsLoaded] = useState(false)

  // Update rotating ref when state changes
  useEffect(() => {
    isRotatingRef.current = isRotating
  }, [isRotating])

  useEffect(() => {
    const points = parsePoints(input)
    pointsRef.current = points
    setPointsLoaded(points.length > 0)
    const maxPossible = (points.length * (points.length - 1)) / 2
    const actualConnections = Math.min(numConnections, maxPossible)
    const conns = buildConnections(points, actualConnections)
    setConnections(conns)
  }, [input, numConnections])

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

    const rangeX = maxX - minX
    const rangeY = maxY - minY
    const rangeZ = maxZ - minZ
    const maxRange = Math.max(rangeX, rangeY, rangeZ, 1) // Ensure at least 1

    // Calculate box size relative to the data range
    // Make boxes visible but not too large
    const boxSize = Math.max(maxRange * 0.01, 100) // At least 1% of range or 100 units

    // Position camera
    const cameraDistance = maxRange * 2.5
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
    let angle = 0
    const animate = () => {
      if (isRotatingRef.current) {
        angle += 0.005
        const radius = cameraDistance
        camera.position.x = centerX + radius * Math.cos(angle)
        camera.position.z = centerZ + radius * Math.sin(angle)
        camera.lookAt(centerX, centerY, centerZ)
      }

      renderer.render(scene, camera)
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    // Handle resize
    const handleResize = () => {
      const newWidth = container.clientWidth
      const newHeight = Math.max(600, window.innerHeight * 0.7)
      camera.aspect = newWidth / newHeight
      camera.updateProjectionMatrix()
      renderer.setSize(newWidth, newHeight)
    }

    window.addEventListener('resize', handleResize)

    return () => {
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

    // Create line material
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xfbbf24,
      opacity: 0.8,
      transparent: true,
      linewidth: 2,
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
            <label className="text-white text-sm font-medium">
              Connections: {numConnections}
            </label>
            <input
              type="range"
              min="0"
              max={Math.min(
                5000,
                (pointsRef.current.length * (pointsRef.current.length - 1)) / 2,
              )}
              value={numConnections}
              onChange={(e) => setNumConnections(Number(e.target.value))}
              className="flex-1 max-w-xs"
            />
          </div>
          <div className="text-white text-sm">
            Junction Boxes: {pointsRef.current.length} | Showing{' '}
            {connections.length} connections
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
