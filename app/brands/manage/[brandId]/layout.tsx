"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { usePerchAuth } from "@/hooks/usePerchAuth"
import { Header } from "./components/header"
import { Sidebar } from "./components/sidebar"
import { Card, CardContent, CardDescription } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface Brand {
  id: string
  name: string
  owner: {
    id: string
  }
  managers: {
    id: string
  }[]
}

interface LayoutProps {
  children: React.ReactNode
  params: {
    brandId: string
  }
}

export default function Layout({ children, params }: LayoutProps) {
  const router = useRouter()
  const { isLoaded, isSignedIn, getToken } = usePerchAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [brand, setBrand] = useState<Brand | null>(null)

  useEffect(() => {
    const checkAccess = async () => {
      try {
        if (!isLoaded) return
        if (!isSignedIn) {
          router.push("/sign-in")
          return
        }

        const token = await getToken()
        if (!token) {
          setError("Authentication required")
          return
        }

        const response = await fetch(`/api/brands/${params.brandId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (!response.ok) {
          if (response.status === 404) {
            setError("Brand not found")
          } else if (response.status === 403) {
            setError("You don't have access to manage this brand")
          } else {
            setError("Failed to load brand")
          }
          return
        }

        const data = await response.json()
        setBrand(data.brand)
      } catch (err) {
        console.error("Error checking brand access:", err)
        setError("Failed to verify brand access")
      } finally {
        setIsLoading(false)
      }
    }

    checkAccess()
  }, [isLoaded, isSignedIn, params.brandId, router, getToken])

  if (!isLoaded || isLoading) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardContent className="py-6">
            <CardDescription className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading...</span>
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !brand) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardContent className="py-6">
            <Alert variant="destructive">
              <AlertTitle>Access Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar brandId={params.brandId} />
      <div className="flex-1">
        <Header brandId={params.brandId} />
        <main className="p-8">{children}</main>
      </div>
    </div>
  )
} 