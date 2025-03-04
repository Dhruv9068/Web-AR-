"use client"

import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { Button } from "@/components/ui/button"
import { Layers, Trash2, X } from "lucide-react"

interface ARViewProps {
  selectedModel: string | null
  placedModels: string[]
  onModelPlace: () => void
  onExit: () => void
  onClearModels: () => void
}

export default function ARView({ selectedModel, placedModels, onModelPlace, onExit, onClearModels }: ARViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isARSessionRunning, setIsARSessionRunning] = useState(false)
  const [isUIVisible, setIsUIVisible] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // These refs will persist across renders
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const xrSessionRef = useRef<XRSession | null>(null)
  const reticleRef = useRef<THREE.Mesh | null>(null)
  const modelsRef = useRef<THREE.Object3D[]>([])
  const hitTestSourceRef = useRef<XRHitTestSource | null>(null)
  const loaderRef = useRef<GLTFLoader | null>(null)
  const modelCache = useRef<Map<string, THREE.Object3D>>(new Map())

  useEffect(() => {
    if (!containerRef.current) return

    // Initialize Three.js
    const scene = new THREE.Scene()
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.xr.enabled = true
    rendererRef.current = renderer

    containerRef.current.appendChild(renderer.domElement)

    // Create a reticle for placement
    const reticleGeometry = new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2)
    const reticleMaterial = new THREE.MeshBasicMaterial()
    const reticle = new THREE.Mesh(reticleGeometry, reticleMaterial)
    reticle.matrixAutoUpdate = false
    reticle.visible = false
    scene.add(reticle)
    reticleRef.current = reticle

    // Set up lighting
    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1)
    light.position.set(0.5, 1, 0.25)
    scene.add(light)

    // Initialize GLTF loader
    loaderRef.current = new GLTFLoader()

    // Start AR session
    const startARSession = async () => {
      try {
        // @ts-ignore - TypeScript doesn't know about the requestSession method
        const session = await navigator.xr.requestSession("immersive-ar", {
          requiredFeatures: ["hit-test", "dom-overlay"],
          domOverlay: { root: containerRef.current },
        })

        xrSessionRef.current = session

        session.addEventListener("end", () => {
          setIsARSessionRunning(false)
          onExit()
        })

        // Set up hit testing
        const viewerSpace = await session.requestReferenceSpace("viewer")
        const hitTestSource = await session.requestHitTestSource({ space: viewerSpace })
        hitTestSourceRef.current = hitTestSource

        // Configure renderer for XR
        renderer.xr.setReferenceSpaceType("local")
        await renderer.xr.setSession(session)

        renderer.setAnimationLoop((timestamp, frame) => {
          if (!frame) return

          // Perform hit test
          if (hitTestSourceRef.current) {
            const hitTestResults = frame.getHitTestResults(hitTestSourceRef.current)

            if (hitTestResults.length > 0) {
              const hit = hitTestResults[0]
              const pose = hit.getPose(renderer.xr.getReferenceSpace())

              if (pose) {
                reticle.visible = true
                reticle.matrix.fromArray(pose.transform.matrix)
              }
            } else {
              reticle.visible = false
            }
          }

          renderer.render(scene, camera)
        })

        setIsARSessionRunning(true)
      } catch (err) {
        console.error("Error starting AR session:", err)
        setError("Failed to start AR session. Please try again.")
        onExit()
      }
    }

    startARSession()

    // Handle window resize
    const handleResize = () => {
      if (cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = window.innerWidth / window.innerHeight
        cameraRef.current.updateProjectionMatrix()
        rendererRef.current.setSize(window.innerWidth, window.innerHeight)
      }
    }

    window.addEventListener("resize", handleResize)

    // Clean up
    return () => {
      window.removeEventListener("resize", handleResize)

      if (rendererRef.current) {
        rendererRef.current.setAnimationLoop(null)
        if (containerRef.current) {
          containerRef.current.removeChild(rendererRef.current.domElement)
        }
      }

      if (xrSessionRef.current) {
        xrSessionRef.current.end()
      }

      if (hitTestSourceRef.current) {
        hitTestSourceRef.current.cancel()
      }
    }
  }, [onExit])

  // Load and place models
  useEffect(() => {
    if (!sceneRef.current || !loaderRef.current || !selectedModel) return

    // Load the selected model if not already cached
    if (!modelCache.current.has(selectedModel)) {
      loaderRef.current.load(
        selectedModel,
        (gltf) => {
          // Scale model appropriately
          const model = gltf.scene

          // Center the model
          const box = new THREE.Box3().setFromObject(model)
          const center = box.getCenter(new THREE.Vector3())
          model.position.sub(center)

          // Scale to reasonable size
          const size = box.getSize(new THREE.Vector3())
          const maxDim = Math.max(size.x, size.y, size.z)
          const scale = 0.2 / maxDim
          model.scale.set(scale, scale, scale)

          // Cache the model
          modelCache.current.set(selectedModel, model.clone())
        },
        undefined,
        (error) => {
          console.error("Error loading model:", error)
          setError(`Failed to load model: ${selectedModel}`)
        },
      )
    }
  }, [selectedModel])

  // Handle tap to place model
  const handleTap = () => {
    if (!sceneRef.current || !reticleRef.current || !reticleRef.current.visible || !selectedModel) return

    // Get the cached model
    const cachedModel = modelCache.current.get(selectedModel)
    if (!cachedModel) {
      console.warn("Model not loaded yet")
      return
    }

    // Clone the model
    const model = cachedModel.clone()

    // Position the model at the reticle
    model.position.setFromMatrixPosition(reticleRef.current.matrix)
    model.quaternion.setFromRotationMatrix(reticleRef.current.matrix)

    // Add to scene
    sceneRef.current.add(model)
    modelsRef.current.push(model)

    // Notify parent component
    onModelPlace()
  }

  const handleClearModels = () => {
    if (!sceneRef.current) return

    // Remove all models from the scene
    modelsRef.current.forEach((model) => {
      sceneRef.current?.remove(model)
    })

    // Clear the models array
    modelsRef.current = []

    // Notify parent component
    onClearModels()
  }

  const handleExitAR = () => {
    if (xrSessionRef.current) {
      xrSessionRef.current.end()
    }
  }

  const toggleUI = () => {
    setIsUIVisible(!isUIVisible)
  }

  return (
    <div ref={containerRef} className="fixed inset-0 touch-none">
      {error && <div className="fixed top-0 left-0 right-0 bg-red-500 text-white p-4 text-center z-50">{error}</div>}

      {isARSessionRunning && (
        <>
          {/* Tap area for placing models */}
          <div className="absolute inset-0 z-10" onClick={handleTap} />

          {/* UI toggle button */}
          <Button variant="secondary" size="icon" className="fixed top-4 right-4 z-20 rounded-full" onClick={toggleUI}>
            <Layers className="h-5 w-5" />
          </Button>

          {/* Controls UI */}
          {isUIVisible && (
            <div className="fixed bottom-8 left-0 right-0 flex justify-center items-center gap-4 z-20 px-4">
              <Button variant="destructive" size="icon" className="rounded-full" onClick={handleClearModels}>
                <Trash2 className="h-5 w-5" />
              </Button>

              <Button onClick={handleExitAR} variant="secondary" className="rounded-full">
                <X className="h-5 w-5 mr-2" />
                Exit AR
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

