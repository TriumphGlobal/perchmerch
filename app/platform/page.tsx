"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { usePerchAuth } from "@/hooks/usePerchAuth"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GenresList } from "@/components/platform/genre-management"
import { BrandApprovals } from "@/components/platform/brand-approvals"
import { FeaturedBrands } from "@/components/platform/featured-brands"
import { ProductModeration } from "@/components/platform/product-moderation"
import { ReportsModeration } from "@/components/platform/reports-moderation"
import { PlatformAnalytics } from "@/components/platform/platform-analytics"

export default function PlatformDashboard() {
  const router = useRouter()
  const { isLoaded, isSignedIn, localUser, isPlatformMod } = usePerchAuth()

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in')
      return
    }

    if (isLoaded && !isPlatformMod) {
      router.push('/')
      return
    }
  }, [isLoaded, isSignedIn, localUser?.role, isPlatformMod, router])

  if (!isLoaded) {
    return <div>Loading...</div>
  }

  if (!isPlatformMod) {
    return <div>Access Denied</div>
  }

  return (
    <div className="container py-10">
      <h1 className="text-4xl font-bold mb-8">Platform Administration</h1>
      <Tabs defaultValue="brands" className="space-y-4">
        <TabsList>
          <TabsTrigger value="brands">Brand Approvals</TabsTrigger>
          <TabsTrigger value="featured">Featured Brands</TabsTrigger>
          <TabsTrigger value="products">Product Moderation</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="genres">Genre Management</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="brands">
          <BrandApprovals />
        </TabsContent>
        <TabsContent value="featured">
          <FeaturedBrands />
        </TabsContent>
        <TabsContent value="products">
          <ProductModeration />
        </TabsContent>
        <TabsContent value="reports">
          <ReportsModeration />
        </TabsContent>
        <TabsContent value="genres">
          <GenresList />
        </TabsContent>
        <TabsContent value="analytics">
          <PlatformAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  )
} 