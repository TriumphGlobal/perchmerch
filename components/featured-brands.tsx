"use client"

import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Store } from "lucide-react"

export function FeaturedBrands() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto px-4 py-8">
      {/* PerchMerch Showcase */}
      <Card className="group hover:shadow-lg transition-all">
        <Link href="/brand/perchmerch">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">PerchMerch Official</CardTitle>
            <CardDescription>Premium merchandise for creators and innovators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="aspect-video relative rounded-lg overflow-hidden bg-muted flex items-center justify-center">
              <Store className="h-12 w-12 text-muted-foreground" />
            </div>
            <div className="mt-4 space-y-2">
              <p className="text-sm text-muted-foreground">
                Discover our curated collection of high-quality merchandise. From custom apparel to unique accessories.
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Featured Products:</span>
                <span className="text-sm text-muted-foreground">Premium Tees • Hoodies • Accessories</span>
              </div>
            </div>
          </CardContent>
        </Link>
      </Card>
    </div>
  )
} 