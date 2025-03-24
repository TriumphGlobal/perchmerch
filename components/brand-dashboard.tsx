"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ShoppingBag, 
  Users, 
  DollarSign, 
  TrendingUp,
  Eye,
  Share2,
  Settings,
  Package,
  UserPlus,
  Activity
} from "lucide-react"
import { Overview } from "./brand/overview"
import { Products } from "./brand/products"
import { Team } from "./brand/team"
import { Settings as BrandSettings } from "./brand/settings"
import { Brand } from "@prisma/client"

interface BrandDashboardProps {
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

export function BrandDashboard({ brand }: BrandDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{brand.name} Dashboard</h1>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <a href={`/${brand.brandId}`} target="_blank">
              <Eye className="mr-2 h-4 w-4" />
              View Store
            </a>
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${brand.totalEarnings?.toFixed(2) || "0.00"}</div>
            <p className="text-xs text-muted-foreground">
              +20.1% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Orders
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{brand.totalOrders || 0}</div>
            <p className="text-xs text-muted-foreground">
              +12.5% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Products
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{brand._count.products}</div>
            <p className="text-xs text-muted-foreground">
              {brand.products.length} total products
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Team Members
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{brand.brandAccess.length}</div>
            <p className="text-xs text-muted-foreground">
              Owners and managers
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            <Activity className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="products">
            <Package className="mr-2 h-4 w-4" />
            Products
          </TabsTrigger>
          <TabsTrigger value="team">
            <UserPlus className="mr-2 h-4 w-4" />
            Team
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <Overview brand={brand} />
        </TabsContent>
        <TabsContent value="products" className="space-y-4">
          <Products brand={brand} />
        </TabsContent>
        <TabsContent value="team" className="space-y-4">
          <Team brand={brand} />
        </TabsContent>
        <TabsContent value="settings" className="space-y-4">
          <BrandSettings brand={brand} />
        </TabsContent>
      </Tabs>
    </div>
  )
} 