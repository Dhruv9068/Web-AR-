"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import ModelSelector from "./model-selector"
import ARView from "./ar-view"

export default function ARExperience() {
  const [isARSupported, setIsARSupported] = useState<boolean | null>(null)
  const [isARSessionActive, setIsARSessionActive] = useState(false)
  const [selectedModel, setSelectedModel] = useState<string | null>(null)
  const [placedModels, setPlacedModels] = useState<string[]>([])

  useEffect(() => {
    // Check if WebXR is supported
    if (typeof window !== "undefined") {
      if ("xr" in navigator) {
        // @ts-ignore - TypeScript doesn't know about the isSessionSupported method
        navigator.xr
          ?.isSessionSupported("immersive-ar")
          .then((supported) => {
            setIsARSupported(supported)
          })
          .catch(() => {
            setIsARSupported(false)
          })
      } else {
        setIsARSupported(false)
      }
    }
  }, [])

  const startARSession = () => {
    setIsARSessionActive(true)
  }

  const endARSession = () => {
    setIsARSessionActive(false)
  }

  const handleModelSelect = (modelPath: string) => {
    setSelectedModel(modelPath)
  }

  const handleModelPlace = () => {
    if (selectedModel && !placedModels.includes(selectedModel)) {
      setPlacedModels([...placedModels, selectedModel])
    }
  }

  const handleClearModels = () => {
    setPlacedModels([])
  }

  if (isARSessionActive) {
    return (
      <ARView
        selectedModel={selectedModel}
        placedModels={placedModels}
        onModelPlace={handleModelPlace}
        onExit={endARSession}
        onClearModels={handleClearModels}
      />
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardContent className="pt-6">
        {isARSupported === null ? (
          <p className="text-center">Checking AR compatibility...</p>
        ) : isARSupported ? (
          <>
            <p className="text-center mb-4 text-green-600">AR is supported on your device!</p>
            <ModelSelector onSelect={handleModelSelect} selectedModel={selectedModel} />
            <Button onClick={startARSession} className="w-full mt-4" disabled={!selectedModel}>
              Start AR Experience
            </Button>
          </>
        ) : (
          <div className="text-center">
            <p className="text-red-500 mb-2">WebXR AR is not supported on this device or browser.</p>
            <p className="text-sm">Please try using Chrome on Android or Safari on iOS 13+.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

