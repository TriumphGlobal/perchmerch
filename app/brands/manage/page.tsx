"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { usePerchAuth } from "@/hooks/usePerchAuth"

export default function BrandManagePage() {
  const router = useRouter()
  const { isLoaded, isSignedIn, localUser } = usePerchAuth()

  useEffect(() => {
    if (isLoaded && (!isSignedIn || !localUser)) {
      router.push("/sign-in")
      return
    }
    
    // Redirect to the specific brand management page if they somehow reach this page
    router.push("/account/brands")
  }, [isLoaded, isSignedIn, localUser, router])

  return null
} 