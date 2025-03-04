import ARExperience from "@/components/ar-experience"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-4">WebXR AR Experience</h1>
      <p className="mb-8 text-center max-w-md">
        Place 3D models in your environment using AR. Works best on compatible mobile devices.
      </p>
      <ARExperience />
    </main>
  )
}

