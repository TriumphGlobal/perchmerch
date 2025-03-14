import { useUser } from "@clerk/nextjs"
import { useEffect, useState } from "react"
import type { DBUser } from "@/types/localDbU"

export function usePerchAuth() {
  const { isLoaded, isSignedIn, user } = useUser()
  const [localUser, setLocalUser] = useState<DBUser | null>(null)

  useEffect(() => {
    // Use the existing getCurrentUser endpoint that's already working
    async function fetchUser() {
      try {
        const response = await fetch('/api/user')
        if (response.ok) {
          const data = await response.json()
          setLocalUser(data)
        }
      } catch (error) {
        console.error('Error fetching user:', error)
      }
    }

    if (isSignedIn) {
      fetchUser()
    }
  }, [isSignedIn])

  return {
    isLoaded,
    isSignedIn,
    clerkUser: user,
    localUser,
    isAdmin: localUser?.role === "superAdmin",
    isPlatformMod: localUser?.role === "platformAdmin" || localUser?.role === "superAdmin"
  }
} 