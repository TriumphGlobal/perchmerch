"use client"

import { useState } from "react"
import { Brand } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Search } from "lucide-react"
import Link from "next/link"

interface ProductsProps {
  brand: Brand & {
    products: any[]
    brandAccess: any[]
    socialMedia: any[]
    genres: any[]
    _count: {
      products: number
    }
  }
}

export function Products({ brand }: ProductsProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredProducts = brand.products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <Button asChild>
          <Link href={`/brands/manage/${brand.brandId}/products/new`}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.map((product) => (
          <Card key={product.id}>
            <CardHeader>
              <CardTitle className="line-clamp-1">{product.name}</CardTitle>
              <CardDescription>
                Added on {new Date(product.createdAt).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Price</Label>
                  <span className="font-medium">${product.price?.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Status</Label>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    product.isApproved
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}>
                    {product.isApproved ? "Approved" : "Pending"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Visibility</Label>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    product.isHidden
                      ? "bg-gray-100 text-gray-800"
                      : "bg-blue-100 text-blue-800"
                  }`}>
                    {product.isHidden ? "Hidden" : "Visible"}
                  </span>
                </div>
              </div>
              <div className="mt-4">
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/brands/manage/${brand.brandId}/products/${product.id}`}>
                    Manage Product
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <h3 className="mt-2 text-sm font-semibold">No products found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchTerm
              ? "Try searching with a different term"
              : "Get started by creating a new product"}
          </p>
          {!searchTerm && (
            <Button className="mt-4" asChild>
              <Link href={`/brands/manage/${brand.brandId}/products/new`}>
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  )
} 