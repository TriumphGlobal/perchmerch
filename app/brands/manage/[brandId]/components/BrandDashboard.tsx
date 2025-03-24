"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Overview } from "./overview"
import { RecentOrders } from "./recent-orders"
import { RecentProducts } from "./recent-products"
import { BrandStats } from "./brand-stats"

interface Brand {
  id: string
  name: string
  description: string | null
  tagline: string | null
  imageUrl: string | null
  brandId: string
  isApproved: boolean
  isHidden: boolean
  access: {
    id: string
    userId: string
    role: string
    user: {
      id: string
      email: string
      name: string | null
    }
  }[]
  _count?: {
    products: number
  }
}

interface BrandDashboardProps {
  brand: Brand
  brandId: string
}

export function BrandDashboard({ brand, brandId }: BrandDashboardProps) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight">
          {brand.name} Dashboard
        </h1>
        <p className="text-muted-foreground">
          Welcome to your brand management dashboard. Here you can manage your products, orders, and brand settings.
        </p>
      </div>

      <BrandStats brandId={brandId} />

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recent-orders">Recent Orders</TabsTrigger>
          <TabsTrigger value="recent-products">Recent Products</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <Overview brandId={brandId} />
        </TabsContent>
        <TabsContent value="recent-orders" className="space-y-4">
          <RecentOrders brandId={brandId} />
        </TabsContent>
        <TabsContent value="recent-products" className="space-y-4">
          <RecentProducts brandId={brandId} />
        </TabsContent>
      </Tabs>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Brand Status</CardTitle>
            <CardDescription>Current approval and visibility status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Approval Status</span>
                <span className={`text-sm ${brand.isApproved ? "text-green-600" : "text-yellow-600"}`}>
                  {brand.isApproved ? "Approved" : "Pending Approval"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Visibility</span>
                <span className={`text-sm ${brand.isHidden ? "text-gray-600" : "text-green-600"}`}>
                  {brand.isHidden ? "Hidden" : "Visible"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common management tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <a
                href={`/brands/manage/${brandId}/products/add`}
                className="block w-full rounded-lg border p-3 text-center hover:bg-accent"
              >
                Add New Product
              </a>
              <a
                href={`/brands/manage/${brandId}/settings`}
                className="block w-full rounded-lg border p-3 text-center hover:bg-accent"
              >
                Brand Settings
              </a>
              <a
                href={`/brands/manage/${brandId}/preview`}
                className="block w-full rounded-lg border p-3 text-center hover:bg-accent"
              >
                Preview Store
              </a>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Support</CardTitle>
            <CardDescription>Get help with your brand</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm">
                Need help managing your brand? Our support team is here to help you succeed.
              </p>
              <a
                href="/support"
                className="block w-full rounded-lg border p-3 text-center hover:bg-accent"
              >
                Contact Support
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 