"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Store, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Brand {
  id: string
  name: string
  brandId: string
  description: string | null
  imageUrl: string | null
  createdAt: string
  isApproved: boolean
  isHidden: boolean
  owner: {
    id: string
    email: string
    name: string | null
  }
}

export function BrandApprovals() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPendingBrands()
  }, [])

  const fetchPendingBrands = async () => {
    try {
      setError(null)
      const response = await fetch("/api/brands/pending")
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || "Failed to fetch pending brands")
      }
      const data = await response.json()
      setBrands(data.brands || [])
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load pending brands"
      setError(message)
      toast.error(message)
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleApproval = async (brandId: string, approve: boolean) => {
    try {
      const response = await fetch(`/api/brands/${brandId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approve }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || "Failed to update brand status")
      }
      
      toast.success(`Brand ${approve ? "approved" : "rejected"} successfully`)
      fetchPendingBrands() // Refresh the list
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update brand status"
      toast.error(message)
      console.error(error)
    }
  }

  const filteredBrands = brands.filter(brand =>
    brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    brand.owner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (brand.owner.name && brand.owner.name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Brand Approvals</CardTitle>
          <CardDescription>Loading pending brands...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Brand Approvals</CardTitle>
          <CardDescription>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Brand Approvals</CardTitle>
        <CardDescription>
          Review and approve new brand applications
        </CardDescription>
        <div className="mt-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by brand name or owner..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredBrands.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              {searchTerm ? 'No brands match your search' : 'No pending brands'}
            </div>
          ) : (
            filteredBrands.map((brand) => (
              <div
                key={brand.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4" />
                    <h3 className="font-medium">{brand.name}</h3>
                    <Badge variant="outline">/{brand.brandId}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{brand.description}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Owner: {brand.owner.name || brand.owner.email}</span>
                    <span>·</span>
                    <span>Created: {new Date(brand.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-600"
                    onClick={() => handleApproval(brand.id, false)}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    className="text-green-600"
                    onClick={() => handleApproval(brand.id, true)}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
} 