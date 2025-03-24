"use client"

import { useEffect, useState } from "react"
import { useAuth, useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"

const SUPERADMIN_EMAIL = "sales@triumphglobal.net"

export function UserSynchronizer() {
  const { isLoaded, isSignedIn, userId } = useAuth()
  const { user } = useUser()
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Only run once we have user data and they're signed in
    if (!isLoaded || !isSignedIn || !userId || !user || isSyncing) return

    const syncUser = async () => {
      try {
        setIsSyncing(true)
        
        // Step 1: Check if the user exists in our database
        const checkResponse = await fetch(`/api/users/check?userId=${userId}`)
        const checkData = await checkResponse.json()
        
        const email = user.primaryEmailAddress?.emailAddress
        const isSuperAdminEmail = email === SUPERADMIN_EMAIL
        
        console.log("User check:", { 
          exists: checkData.exists, 
          isSuperAdmin: checkData.isSuperAdmin,
          isPlatformAdmin: checkData.isPlatformAdmin,
          userEmail: email,
          isSuperAdminEmail
        })
        
        if (!checkData.exists) {
          // Step 2: Create the user if they don't exist
          console.log("Creating new user:", email)
          const createResponse = await fetch('/api/users/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: userId,
              email: email,
              image: user.imageUrl,
              isSuperAdmin: isSuperAdminEmail
            })
          })
          
          if (!createResponse.ok) {
            throw new Error('Failed to create user')
          }
          
          // Force reload to see changes
          window.location.reload()
        } 
        // Special handling for superAdmin email
        else if (isSuperAdminEmail && (!checkData.isSuperAdmin || !checkData.isPlatformAdmin)) {
          console.log("Initializing superAdmin privileges for:", email)
          // If this is the superAdmin email but doesn't have admin privileges, grant them
          const adminResponse = await fetch(`/api/init-superadmin`)
          const adminData = await adminResponse.json()
          
          console.log("Admin initialization response:", adminData)
          
          if (adminData.success) {
            // Force reload to apply privileges
            window.location.reload()
          } else {
            console.error("Failed to initialize superAdmin:", adminData.error || "Unknown error")
          }
        } else {
          console.log("User already exists with correct privileges")
        }
        
        // Refresh the page to apply any role changes
        router.refresh()
      } catch (err) {
        console.error('Error syncing user:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsSyncing(false)
      }
    }

    syncUser()
  }, [isLoaded, isSignedIn, userId, user, isSyncing, router])

  // This is an invisible component, it doesn't render anything
  return null
} 