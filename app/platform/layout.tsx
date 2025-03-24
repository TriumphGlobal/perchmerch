"use client"

import { usePerchAuth } from '../../hooks/usePerchAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isLoaded, isSignedIn, isPlatformMod } = usePerchAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in')
      return
    }

    if (isLoaded && !isPlatformMod) {
      router.push('/')
      return
    }
  }, [isLoaded, isSignedIn, isPlatformMod, router])

  return (
    <div className="container mx-auto py-10">
      {children}
    </div>
  )
} 