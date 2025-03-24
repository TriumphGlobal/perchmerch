"use client"

import { useAuth, useUser } from "@clerk/nextjs"
import { useEffect, useState } from "react"
import type { DBUser } from "../types/localDbU"

export function usePerchAuth() {
  const { isLoaded: clerkLoaded, isSignedIn: clerkIsSignedIn, getToken } = useAuth()
  const { user: clerkUser, isLoaded: userLoaded } = useUser()
  const [localUser, setLocalUser] = useState<DBUser | null>(null)
  const [isLocalUserLoaded, setIsLocalUserLoaded] = useState(false)

  // Simplified auth state - only depends on Clerk
  const isSignedIn = clerkLoaded && userLoaded && clerkIsSignedIn
  const isLoaded = clerkLoaded && userLoaded && isLocalUserLoaded

  // Role checks depend on local user data
  const isAdmin = isSignedIn && localUser?.role === "superAdmin"
  const isPlatformMod = isSignedIn && (
    localUser?.role === "platformAdmin" || 
    localUser?.role === "superAdmin"
  )

  // Load local user data for additional info (not auth-critical)
  useEffect(() => {
    let isMounted = true
    let fetchInterval: NodeJS.Timeout | null = null

    async function fetchLocalUser() {
      if (!isMounted || !isSignedIn) return

      try {
        const token = await getToken()
        if (!token || !isMounted) return

        const response = await fetch('/api/user', {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Authorization': `Bearer ${token}`
          }
        })

        if (!isMounted) return

        if (response.ok) {
          const data = await response.json()
          setLocalUser(data)
        }
        setIsLocalUserLoaded(true)
      } catch (error) {
        console.error('Error fetching local user:', error)
        setIsLocalUserLoaded(true)
      }
    }

    // Reset states when not signed in
    if (!isSignedIn) {
      setLocalUser(null)
      setIsLocalUserLoaded(true)
      if (fetchInterval) {
        clearInterval(fetchInterval)
      }
      return
    }

    // Only fetch when signed in
    fetchLocalUser()
    fetchInterval = setInterval(fetchLocalUser, 5000)

    return () => {
      isMounted = false
      if (fetchInterval) {
        clearInterval(fetchInterval)
      }
    }
  }, [isSignedIn, getToken])

  // Debug log for auth state
  console.log('Auth state:', {
    clerkLoaded,
    userLoaded,
    isLoaded,
    isSignedIn,
    localUserRole: localUser?.role,
    isAdmin,
    isPlatformMod,
    hasLocalUser: !!localUser,
    localUserLoaded: isLocalUserLoaded,
    email: clerkUser?.emailAddresses?.[0]?.emailAddress
  })

  return {
    isLoaded,
    isSignedIn,
    isAdmin,
    isPlatformMod,
    localUser,
    isLocalUserLoaded,
    clerkUser,
    getToken,
    email: clerkUser?.emailAddresses?.[0]?.emailAddress
  }
} 