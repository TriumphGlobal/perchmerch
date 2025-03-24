"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Star, Store } from "lucide-react"
import { toast } from "sonner"

interface Brand {
  id: string
  name: string
  brandId: string
  description: string | null
  isFeatured: boolean
  totalSales: number
  productCount: number
}

export function FeaturedBrands() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBrands()
  }, [])

  const fetchBrands = async () => {
    try {
      const response = await fetch("/api/brands/all")
      if (!response.ok) throw new Error("Failed to fetch brands")
      const data = await response.json()
      setBrands(data.brands || [])
    } catch (error) {
      toast.error("Failed to load brands")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleFeatureToggle = async (brandId: string, isFeatured: boolean) => {
    try {
      const response = await fetch(`/api/brands/${brandId}/feature`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured: !isFeatured }),
      })

      if (!response.ok) throw new Error("Failed to update featured status")
      
      toast.success(`Brand ${!isFeatured ? "featured" : "unfeatured"} successfully`)
      fetchBrands() // Refresh the list
    } catch (error) {
      toast.error("Failed to update featured status")
      console.error(error)
    }
  }

  const filteredBrands = brands.filter(brand =>
    brand.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div>Loading brands...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Featured Brands</CardTitle>
        <CardDescription>
          Manage which brands are featured on the platform
        </CardDescription>
        <div className="mt-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search brands..."
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
              {searchTerm ? 'No brands match your search' : 'No brands found'}
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
                    {brand.isFeatured && (
                      <Badge variant="secondary">
                        <Star className="w-3 h-3 mr-1 fill-current" />
                        Featured
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{brand.description}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Products: {brand.productCount}</span>
                    <span>·</span>
                    <span>Sales: ${brand.totalSales.toFixed(2)}</span>
                  </div>
                </div>
                
                <Button
                  variant={brand.isFeatured ? "outline" : "default"}
                  size="sm"
                  onClick={() => handleFeatureToggle(brand.id, brand.isFeatured)}
                >
                  <Star className={`w-4 h-4 mr-2 ${brand.isFeatured ? "fill-current" : ""}`} />
                  {brand.isFeatured ? "Unfeature" : "Feature"}
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
} 