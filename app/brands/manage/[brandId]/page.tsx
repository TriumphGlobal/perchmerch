"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, Loader2, ShoppingBag } from "lucide-react"
import { usePerchAuth } from "@/hooks/usePerchAuth"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"

interface Brand {
  id: string
  name: string
  description: string | null
  tagline: string | null
  imageUrl: string | null
  brandId: string
  isApproved: boolean
  isHidden: boolean
  access: BrandAccess[]
  _count?: {
    products: number
  }
}

interface BrandAccess {
  id: string
  userId: string
  role: string
  user: {
    id: string
    email: string
    name: string | null
  }
}

export default function BrandManagePage() {
  const params = useParams()
  const router = useRouter()
  const { isSignedIn, localUser, clerkUser } = usePerchAuth()
  const [brand, setBrand] = useState<Brand | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // First check authentication
    if (!isSignedIn || !clerkUser?.emailAddresses?.[0]?.emailAddress) {
      console.log("[BRAND_MANAGE] Not signed in, redirecting to sign-in")
      router.push("/sign-in")
      return
    }

    // Only fetch brand if we have a user and they're signed in
    const fetchBrand = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const userEmail = clerkUser.emailAddresses[0].emailAddress
        const response = await fetch(`/api/brands/${params.brandId}`, {
          headers: {
            "user-email": userEmail
          }
        })
        
        const data = await response.json()
        console.log("[BRAND_MANAGE] API response:", {
          ok: response.ok,
          status: response.status,
          data
        })
        
        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch brand")
        }

        setBrand(data.brand)
      } catch (error) {
        console.error("[BRAND_MANAGE] Error:", error)
        setError(error instanceof Error ? error.message : "Failed to load brand")
      } finally {
        setLoading(false)
      }
    }

    fetchBrand()
  }, [isSignedIn, clerkUser, params.brandId, router])

  if (loading) {
    return (
      <div className="container mx-auto py-6 flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error || !brand) {
    return (
      <Alert variant="destructive" className="container mx-auto mt-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Access Error</AlertTitle>
        <AlertDescription>
          {error || "Brand not found"}
        </AlertDescription>
      </Alert>
    )
  }

  // Simple brand header with tabs
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">{brand.name}</h1>
            <p className="text-muted-foreground">
              {brand.tagline || "Manage your brand"}
            </p>
          </div>
          <div className="flex gap-2">
            {brand.isApproved ? (
              <Button
                variant="outline"
                onClick={() => router.push(`/brands/${brand.brandId}`)}
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                View Store
              </Button>
            ) : (
              <Alert className="max-w-xs">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your brand is pending approval
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Brand Status</CardTitle>
                <CardDescription>Current status and visibility of your brand</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-1">Approval Status</h3>
                    <p className={`text-sm ${brand.isApproved ? "text-green-600" : "text-yellow-600"}`}>
                      {brand.isApproved ? "Approved" : "Pending Approval"}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="font-medium mb-1">Visibility</h3>
                    <p className={`text-sm ${brand.isHidden ? "text-yellow-600" : "text-green-600"}`}>
                      {brand.isHidden ? "Hidden" : "Visible"}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="font-medium mb-1">Products</h3>
                    <p className="text-sm text-muted-foreground">
                      {brand._count?.products || 0} products in your store
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Products</CardTitle>
                    <CardDescription>Manage your brand's products</CardDescription>
                  </div>
                  <Button onClick={() => router.push(`/brands/manage/${brand.brandId}/products/new`)}>
                    Add Product
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Products list will be implemented separately */}
                <p className="text-muted-foreground text-sm">
                  No products yet. Click "Add Product" to create your first product.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Brand Settings</CardTitle>
                <CardDescription>Configure your brand's details and appearance</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Settings form will be implemented separately */}
                <p className="text-muted-foreground text-sm">
                  Brand settings configuration will be available soon.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team">
            <Card>
              <CardHeader>
                <CardTitle>Team Management</CardTitle>
                <CardDescription>Manage who has access to your brand</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Team management will be implemented separately */}
                <p className="text-muted-foreground text-sm">
                  Team management features will be available soon.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 