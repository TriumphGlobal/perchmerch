"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Search, DollarSign } from "lucide-react"
import { toast } from "sonner"
import { Brand as PrismaBrand } from "@prisma/client"

interface BrandWithModifier extends PrismaBrand {
  lastModifiedBy: {
    email: string;
  } | null;
}

export function BrandsCommissions() {
  const [brands, setBrands] = useState<BrandWithModifier[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [editingBrand, setEditingBrand] = useState<string | null>(null)

  useEffect(() => {
    fetchBrands()
  }, [])

  const fetchBrands = async () => {
    try {
      const response = await fetch("/api/brands/commissions")
      if (!response.ok) throw new Error("Failed to fetch brands")
      const data = await response.json()
      setBrands(data)
    } catch (error) {
      toast.error("Failed to load brands")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleCommissionUpdate = async (brandId: string, newRate: number) => {
    try {
      const response = await fetch(`/api/brands/${brandId}/commission`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commissionRate: newRate }),
      })

      if (!response.ok) throw new Error("Failed to update commission rate")
      
      toast.success("Commission rate updated successfully")
      setEditingBrand(null)
      fetchBrands() // Refresh the list
    } catch (error) {
      toast.error("Failed to update commission rate")
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Brand Commissions</CardTitle>
          <CardDescription>
            Manage commission rates for brands (Default: 50%, Maximum: 80%)
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
                    <h3 className="font-medium">{brand.name}</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        <DollarSign className="w-3 h-3 mr-1" />
                        Sales: ${brand.totalSales.toFixed(2)}
                      </Badge>
                      {brand.lastModifiedBy && (
                        <Badge variant="outline">
                          Last modified by: {brand.lastModifiedBy.email}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {editingBrand === brand.id ? (
                      <div className="flex items-center gap-4">
                        <div className="w-48">
                          <Slider
                            defaultValue={[brand.commissionRate]}
                            max={80}
                            min={50}
                            step={1}
                            onValueChange={(value) => {
                              const updatedBrands = brands.map(b =>
                                b.id === brand.id ? { ...b, commissionRate: value[0] } : b
                              )
                              setBrands(updatedBrands)
                            }}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{brand.commissionRate}%</span>
                          <Button
                            size="sm"
                            onClick={() => handleCommissionUpdate(brand.id, brand.commissionRate)}
                          >
                            Save
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingBrand(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <span className="font-medium">{brand.commissionRate}%</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingBrand(brand.id)}
                        >
                          Edit Rate
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}



        
