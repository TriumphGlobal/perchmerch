"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Store, Search, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { usePerchAuth } from "@/hooks/usePerchAuth"
import Image from "next/image"

interface Brand {
  id: string
  name: string
  description: string | null
  tagline: string | null
  imageUrl: string | null
  brandId: string
  isApproved: boolean
  isHidden: boolean
  createdAt: string
  owner: {
    id: string
    email: string
    name: string | null
  }
}

export default function BrandApprovalsPage() {
  const router = useRouter()
  const { isSignedIn, localUser } = usePerchAuth()
  const [brands, setBrands] = useState<Brand[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    if (!isSignedIn || !localUser) {
      router.push("/sign-in")
      return
    }

    if (!["platformModerator", "superAdmin"].includes(localUser.role)) {
      router.push("/")
      return
    }

    fetchPendingBrands()
  }, [isSignedIn, localUser, router])

  const fetchPendingBrands = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/brands/pending")
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to fetch pending brands")
      }
      const data = await response.json()
      setBrands(data.brands)
    } catch (error) {
      console.error("Error fetching pending brands:", error)
      setError(error instanceof Error ? error.message : "Failed to load brands")
      toast({
        title: "Error",
        description: "Failed to load pending brands. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApproval = async (brandId: string, approve: boolean) => {
    try {
      setProcessingId(brandId)
      const response = await fetch("/api/brands", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ brandId, approve })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update brand status")
      }

      setBrands(brands.filter(brand => brand.id !== brandId))
      toast({
        title: approve ? "Brand Approved" : "Brand Rejected",
        description: approve 
          ? "The brand has been approved and is now visible to users"
          : "The brand has been rejected",
      })
    } catch (error) {
      console.error("Error updating brand status:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update brand status",
        variant: "destructive"
      })
    } finally {
      setProcessingId(null)
    }
  }

  const filteredBrands = brands.filter(brand => 
    brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    brand.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    brand.owner.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    brand.owner.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="container mx-auto py-6 flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="container mx-auto mt-6">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Brand Approvals</h1>
            <p className="text-muted-foreground">
              Review and approve new brand submissions
            </p>
          </div>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search brands..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {brands.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Pending Brands</CardTitle>
              <CardDescription>
                There are no brands waiting for approval at this time
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-6">
            {filteredBrands.map((brand) => (
              <Card key={brand.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 relative bg-muted rounded-lg overflow-hidden">
                        {brand.imageUrl ? (
                          <Image
                            src={brand.imageUrl}
                            alt={brand.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Store className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div>
                        <CardTitle>{brand.name}</CardTitle>
                        <CardDescription>/{brand.brandId}</CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-24"
                        onClick={() => handleApproval(brand.id, false)}
                        disabled={!!processingId}
                      >
                        {processingId === brand.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        className="w-24"
                        onClick={() => handleApproval(brand.id, true)}
                        disabled={!!processingId}
                      >
                        {processingId === brand.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-1">Description</h3>
                      <p className="text-sm text-muted-foreground">
                        {brand.description || "No description provided"}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">Owner</h3>
                      <p className="text-sm text-muted-foreground">
                        {brand.owner.name || brand.owner.email}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">Submitted</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(brand.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 