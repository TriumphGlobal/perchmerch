"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { usePerchAuth } from "@/hooks/usePerchAuth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { toast } from "sonner"

interface Brand {
  id: string
  name: string
  brandId: string
  description: string | null
  tagline: string | null
  imageUrl: string | null
  isApproved: boolean
  isHidden: boolean
  totalSales: number
  totalEarnings: number
  _count?: {
    products: number
  }
  access: Array<{
    id: string
    userId: string
    role: string
    user: {
      id: string
      email: string
      name: string | null
    }
  }>
}

export default function BrandsPage() {
  const router = useRouter()
  const { isLoaded, isSignedIn, localUser } = usePerchAuth()
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in')
      return
    }

    if (isLoaded && isSignedIn && localUser?.email) {
      fetchBrands()
    }
  }, [isLoaded, isSignedIn, localUser, router])

  const fetchBrands = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/brands?userEmail=${localUser?.email}`)
      if (!response.ok) throw new Error("Failed to fetch brands")
      const data = await response.json()
      console.log("Fetched brands:", data.brands)
      setBrands(data.brands || [])
    } catch (error) {
      console.error("Error fetching brands:", error)
      toast.error("Failed to load brands")
    } finally {
      setLoading(false)
    }
  }

  if (!isLoaded || loading) {
    return <div>Loading...</div>
  }

  if (!isSignedIn) {
    return null // Router will handle redirect
  }

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Your Brands</h1>
        <Button onClick={() => router.push('/brands/create')}>
          <Plus className="w-4 h-4 mr-2" />
          Create Brand
        </Button>
      </div>

      {brands.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Brands Yet</CardTitle>
            <CardDescription>
              You haven't created any brands yet. Get started by creating your first brand!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/brands/create')}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Brand
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand) => (
            <Card key={brand.id} className={brand.isHidden ? "opacity-60" : ""}>
              <CardHeader>
                <CardTitle>{brand.name}</CardTitle>
                <CardDescription>{brand.description || brand.tagline}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Status:</span>
                    <span className={brand.isApproved ? "text-green-600" : "text-yellow-600"}>
                      {brand.isApproved ? "Approved" : "Pending Approval"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Products:</span>
                    <span>{brand._count?.products || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Sales:</span>
                    <span>${brand.totalSales.toFixed(2)}</span>
                  </div>
                  <div className="pt-4">
                    <Button 
                      className="w-full"
                      variant={brand.isApproved ? "default" : "secondary"}
                      onClick={() => router.push(`/brands/manage/${brand.brandId}`)}
                    >
                      {brand.isApproved ? "Manage Brand" : "View Status"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 