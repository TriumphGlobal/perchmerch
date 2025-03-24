"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"

interface Brand {
  id: string
  name: string
  description: string
  tagline: string | null
  imageUrl: string | null
  isApproved: boolean
  isHidden: boolean
  colors: string[]
  socialMedia: {
    website: string | null
    facebook: string | null
    twitter: string | null
    telegram: string | null
    customLink1: string | null
    customLink2: string | null
    customLink3: string | null
  } | null
}

export default function BrandStorePage() {
  const params = useParams()
  const [brand, setBrand] = useState<Brand | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchBrand = async () => {
      try {
        const response = await fetch(`/api/brands/${params.brandId}`)
        if (!response.ok) {
          throw new Error("Failed to fetch brand")
        }
        const data = await response.json()
        setBrand(data.brand)
      } catch (error) {
        setError("Failed to load brand")
        console.error("Error fetching brand:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (params.brandId) {
      fetchBrand()
    }
  }, [params.brandId])

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardDescription className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading brand...</span>
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (error || !brand) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardContent>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Failed to Load</AlertTitle>
                <AlertDescription>
                  {error || "Brand not found"}
                </AlertDescription>
              </Alert>
            </CardContent>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (!brand.isApproved || brand.isHidden) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Brand Not Available</CardTitle>
            <CardContent>
              <Alert>
                <AlertTitle>This brand is not currently visible</AlertTitle>
                <AlertDescription>
                  This brand is either pending approval or has been hidden.
                </AlertDescription>
              </Alert>
            </CardContent>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>{brand.name}</CardTitle>
          {brand.tagline && (
            <CardDescription>{brand.tagline}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {brand.imageUrl && (
              <div className="relative w-full aspect-video">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={brand.imageUrl}
                  alt={brand.name}
                  className="object-cover rounded-lg"
                />
              </div>
            )}
            <div className="prose max-w-none">
              <p>{brand.description}</p>
            </div>
            {brand.colors.length > 0 && (
              <div className="flex gap-2">
                {brand.colors.map((color, index) => (
                  <div
                    key={index}
                    className="w-6 h-6 rounded-full border"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            )}
            {brand.socialMedia && (
              <div className="flex gap-4">
                {brand.socialMedia.website && (
                  <a href={brand.socialMedia.website} target="_blank" rel="noopener noreferrer">
                    Website
                  </a>
                )}
                {brand.socialMedia.facebook && (
                  <a href={brand.socialMedia.facebook} target="_blank" rel="noopener noreferrer">
                    Facebook
                  </a>
                )}
                {brand.socialMedia.twitter && (
                  <a href={brand.socialMedia.twitter} target="_blank" rel="noopener noreferrer">
                    Twitter
                  </a>
                )}
                {brand.socialMedia.telegram && (
                  <a href={brand.socialMedia.telegram} target="_blank" rel="noopener noreferrer">
                    Telegram
                  </a>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 