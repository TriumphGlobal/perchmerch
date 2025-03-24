"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"

interface Product {
  id: string
  name: string
  description: string
  price: number
  imageUrl: string
  totalSales: number
  totalRevenue: number
  inStock: boolean
}

interface TopProductsProps {
  products: Product[]
}

export function TopProducts({ products }: TopProductsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Products</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-8">
            {products.map((product) => (
              <div key={product.id} className="flex items-center">
                <div className="relative h-16 w-16 overflow-hidden rounded-md">
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {product.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ${product.price.toFixed(2)}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant={product.inStock ? "default" : "secondary"}>
                      {product.inStock ? "In Stock" : "Out of Stock"}
                    </Badge>
                    <Badge variant="secondary">
                      {product.totalSales} sold
                    </Badge>
                  </div>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-sm font-medium">
                    ${product.totalRevenue.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Total Revenue
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
} 