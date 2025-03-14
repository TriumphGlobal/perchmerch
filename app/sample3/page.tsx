"use client"

import { useUser } from "@clerk/nextjs"
import { useEffect, useState } from "react"

export default function Sample3Page() {
  const { isLoaded, isSignedIn } = useUser()
  const [isLoading, setIsLoading] = useState(true)
  const [userData, setUserData] = useState<{ isSignedIn: boolean; email?: string; name?: string } | null>(null)

  useEffect(() => {
    async function fetchUserData() {
      try {
        const response = await fetch('/api/user')
        if (response.ok) {
          const data = await response.json()
          setUserData({
            isSignedIn: true,
            email: data.email,
            name: data.name
          })
        } else {
          setUserData({
            isSignedIn: false
          })
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
        setUserData({
          isSignedIn: false
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (isSignedIn) {
      fetchUserData()
    } else {
      setIsLoading(false)
      setUserData({ isSignedIn: false })
    }
  }, [isSignedIn])

  if (!isLoaded || isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Sample 3 - Middleware Auth Check</h1>
      <div style={{ marginTop: '20px' }}>
        <h2>Auth Status</h2>
        <p>Signed In: {userData?.isSignedIn ? 'Yes' : 'No'}</p>
        {userData?.isSignedIn && (
          <div>
            <h2>Local DB Data</h2>
            <p>Email: {userData.email}</p>
            <p>Name: {userData.name || 'Not set'}</p>
          </div>
        )}
      </div>
    </div>
  )
} 