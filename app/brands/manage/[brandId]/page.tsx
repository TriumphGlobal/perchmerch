"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, Loader2, Settings, ShoppingBag, Users } from "lucide-react"
import { usePerchAuth } from "@/hooks/usePerchAuth"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import type { DBUser, UserRole } from "@/types/localDbU"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

interface APIResponse {
  error?: string
  brand?: Brand
}

export default function BrandManagePage() {
  const params = useParams()
  const router = useRouter()
  const { isSignedIn, localUser } = usePerchAuth()
  const [brand, setBrand] = useState<Brand | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newManagerEmail, setNewManagerEmail] = useState("")
  const [addingManager, setAddingManager] = useState(false)

  useEffect(() => {
    if (!isSignedIn || !localUser) {
      router.push("/sign-in")
      return
    }

    if (isSignedIn && localUser?.email) {
      fetchBrand()
    }
  }, [isSignedIn, localUser, params.brandId])

  const fetchBrand = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/brands/${params.brandId}`, {
        headers: {
          "user-email": localUser?.email || ""
        }
      })
      
      const data: APIResponse = await response.json()
      
      if (!response.ok || !data.brand) {
        throw new Error(data.error || "Failed to fetch brand")
      }
      
      // Check if user has access to manage this brand
      const userAccess = data.brand.access?.find((access: BrandAccess) => access.user.email === localUser?.email)
      const isOwner = userAccess?.role === "owner"
      const isManager = userAccess?.role === "manager"
      const isAdmin = (localUser as DBUser)?.role === "superAdmin" || (localUser as DBUser)?.role === "platformAdmin"

      if (!isOwner && !isManager && !isAdmin) {
        throw new Error("You do not have permission to manage this brand")
      }

      setBrand(data.brand)
    } catch (error) {
      console.error("Error fetching brand:", error)
      setError(error instanceof Error ? error.message : "Failed to load brand")
    } finally {
      setLoading(false)
    }
  }

  const handleAddManager = async () => {
    if (!newManagerEmail) return
    setAddingManager(true)
    try {
      const res = await fetch(`/api/brands/${params.brandId}/access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newManagerEmail,
          role: "manager"
        })
      })
      if (!res.ok) {
        throw new Error("Failed to add manager")
      }
      // Refresh brand data
      const brandRes = await fetch(`/api/brands/${params.brandId}`)
      const brandData = await brandRes.json()
      setBrand(brandData)
      setNewManagerEmail("")
    } catch (err) {
      setError("Failed to add manager")
      console.error(err)
    } finally {
      setAddingManager(false)
    }
  }

  const handleUpdateAccess = async (userId: string, role: string) => {
    try {
      const res = await fetch(`/api/brands/${params.brandId}/access/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role })
      })
      if (!res.ok) {
        throw new Error("Failed to update access")
      }
      // Refresh brand data
      const brandRes = await fetch(`/api/brands/${params.brandId}`)
      const brandData = await brandRes.json()
      setBrand(brandData)
    } catch (err) {
      setError("Failed to update access")
      console.error(err)
    }
  }

  const handleRemoveAccess = async (userId: string) => {
    try {
      const res = await fetch(`/api/brands/${params.brandId}/access/${userId}`, {
        method: "DELETE"
      })
      if (!res.ok) {
        throw new Error("Failed to remove access")
      }
      // Refresh brand data
      const brandRes = await fetch(`/api/brands/${params.brandId}`)
      const brandData = await brandRes.json()
      setBrand(brandData)
    } catch (err) {
      setError("Failed to remove access")
      console.error(err)
    }
  }

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

  // We already checked access in fetchBrand, so we can use these values safely
  const userAccess = brand.access.find(access => access.user.email === localUser?.email)
  const isOwner = userAccess?.role === "owner"
  const isManager = userAccess?.role === "manager"
  const isAdmin = (localUser as DBUser)?.role === "superAdmin" || (localUser as DBUser)?.role === "platformAdmin"

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">{brand.name}</h1>
            <p className="text-muted-foreground">
              {brand.tagline || "Manage your brand settings and content"}
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
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Brand Status</CardTitle>
                  <CardDescription>
                    Current status and visibility of your brand
                  </CardDescription>
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

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>
                    Common tasks and management options
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push(`/brands/manage/${brand.brandId}/products/new`)}
                    >
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Add Product
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push(`/brands/manage/${brand.brandId}/settings`)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Brand Settings
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push(`/brands/manage/${brand.brandId}/team`)}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Manage Team
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="products">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Products</CardTitle>
                    <CardDescription>
                      Manage your brand's products
                    </CardDescription>
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
                <CardDescription>
                  Configure your brand's details and appearance
                </CardDescription>
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
                {isOwner && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4">Add Team Member</h3>
                    <div className="flex gap-4">
                      <Input
                        placeholder="Enter email address"
                        value={newManagerEmail}
                        onChange={(e) => setNewManagerEmail(e.target.value)}
                      />
                      <Button onClick={handleAddManager} disabled={addingManager}>
                        {addingManager ? "Adding..." : "Add Manager"}
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Current Team Members</h3>
                  {brand.access.map((access) => (
                    <div key={access.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{access.user.email}</p>
                        <p className="text-sm text-gray-500">{access.user.name}</p>
                      </div>
                      {isOwner && access.user.id !== localUser?.id && (
                        <div className="flex items-center gap-2">
                          <Select
                            value={access.role}
                            onValueChange={(value) => handleUpdateAccess(access.userId, value)}
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="owner">Owner</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveAccess(access.userId)}
                          >
                            Remove
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 