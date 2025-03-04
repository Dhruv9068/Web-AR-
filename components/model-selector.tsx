"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import Image from "next/image"

interface ModelSelectorProps {
  onSelect: (modelPath: string) => void
  selectedModel: string | null
}

interface Model {
  name: string
  path: string
  thumbnail: string
}

export default function ModelSelector({ onSelect, selectedModel }: ModelSelectorProps) {
  const [models, setModels] = useState<Model[]>([
    {
      name: "Chair",
      path: "/assets/chair.glb",
      thumbnail: "/placeholder.svg?height=100&width=100",
    },
    {
      name: "Table",
      path: "/assets/table.glb",
      thumbnail: "/placeholder.svg?height=100&width=100",
    },
    {
      name: "Lamp",
      path: "/assets/lamp.glb",
      thumbnail: "/placeholder.svg?height=100&width=100",
    },
    {
      name: "Plant",
      path: "/assets/plant.glb",
      thumbnail: "/placeholder.svg?height=100&width=100",
    },
    {
      name: "Sofa",
      path: "/assets/sofa.glb",
      thumbnail: "/placeholder.svg?height=100&width=100",
    },
  ])

  return (
    <div className="w-full">
      <h3 className="font-medium mb-2">Select a model to place:</h3>
      <ScrollArea className="h-[200px] rounded-md border">
        <div className="grid grid-cols-2 gap-2 p-2">
          {models.map((model) => (
            <Card
              key={model.path}
              className={`cursor-pointer transition-all ${selectedModel === model.path ? "ring-2 ring-primary" : ""}`}
              onClick={() => onSelect(model.path)}
            >
              <CardContent className="p-2 flex flex-col items-center">
                <div className="relative w-full h-24 mb-2">
                  <Image src={model.thumbnail || "/placeholder.svg"} alt={model.name} fill className="object-contain" />
                </div>
                <span className="text-sm font-medium">{model.name}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

