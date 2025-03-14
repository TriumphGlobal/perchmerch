"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface Brand {
  id: string
  name: string
  description?: string
  imageUrl?: string
  brandId: string
}

interface BrandGridProps {
  brands: Brand[]
  className?: string
}

export function BrandGrid({ brands, className }: BrandGridProps) {
  if (!brands || brands.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No brands available</p>
      </div>
    )
  }

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", className)}>
      {brands.map((brand) => (
        <Link key={brand.id} href={`/brands/${brand.brandId}`}>
          <Card className="h-full hover:shadow-lg transition-shadow">
            {brand.imageUrl && (
              <div className="aspect-video relative overflow-hidden rounded-t-lg">
                <img
                  src={brand.imageUrl}
                  alt={brand.name}
                  className="object-cover w-full h-full"
                />
              </div>
            )}
            <CardHeader>
              <CardTitle>{brand.name}</CardTitle>
            </CardHeader>
            {brand.description && (
              <CardContent>
                <p className="text-muted-foreground line-clamp-2">{brand.description}</p>
              </CardContent>
            )}
          </Card>
        </Link>
      ))}
    </div>
  )
} 