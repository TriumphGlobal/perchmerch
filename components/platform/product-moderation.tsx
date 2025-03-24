"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Search, CheckCircle, XCircle, AlertTriangle } from "lucide-react"

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  imageUrl: string | null
  isApproved: boolean
  isHidden: boolean
  createdAt: string
  brandName: string
  brandId: string
}

export function ProductModeration() {
  const [products, setProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products/pending')
      if (!response.ok) throw new Error('Failed to fetch products')
      const data = await response.json()
      setProducts(data)
    } catch (error) {
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const handleModeration = async (productId: string, approve: boolean) => {
    try {
      const response = await fetch(`/api/products/${productId}/moderate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ approve }),
      })

      if (!response.ok) throw new Error('Failed to moderate product')
      
      toast.success(`Product ${approve ? 'approved' : 'rejected'} successfully`)
      fetchProducts() // Refresh the list
    } catch (error) {
      toast.error('Failed to moderate product')
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.brandName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Product Moderation</CardTitle>
          <CardDescription>
            Review and approve new product listings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products or brands..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div className="space-y-4">
            {filteredProducts.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                {searchTerm ? 'No products match your search' : 'No products need moderation'}
              </div>
            ) : (
              filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <h3 className="font-medium">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {product.description || 'No description provided'}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        ${product.price.toFixed(2)}
                      </Badge>
                      <Badge variant="outline">
                        Brand: {product.brandName}
                      </Badge>
                      <Badge variant="outline">
                        Added: {new Date(product.createdAt).toLocaleDateString()}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600"
                      onClick={() => handleModeration(product.id, false)}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-green-600"
                      onClick={() => handleModeration(product.id, true)}
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
    </div>
  )
} 