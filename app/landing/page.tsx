"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useAuth } from "@/contexts/auth-context"

export default function LandingPage() {
  const { user } = useAuth()
  const router = useRouter()

  // Redirect to home page if user is not logged in
  useEffect(() => {
    if (!user) {
      router.push("/")
    }
  }, [user, router])

  // If user is not logged in, don't render anything while redirecting
  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col items-center justify-center gap-8 text-center">
        <section className="space-y-6 max-w-3xl">
          <h1 className="text-4xl font-bold">Welcome to PerchMerch, {user.username}!</h1>
          <p className="text-xl text-muted-foreground">
            Your one-stop platform for creating and managing your merchandise stores.
          </p>
          
          <div className="relative w-full h-64 sm:h-80 md:h-96 rounded-lg overflow-hidden my-8">
            <Image 
              src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=2070&auto=format&fit=crop"
              alt="Merchandise Store" 
              fill
              className="object-cover"
              priority
            />
          </div>
          
          <p className="text-lg">
            Use the navigation links above to manage your brands, view your account, or explore our demo store.
          </p>
        </section>
      </div>
    </div>
  )
} 