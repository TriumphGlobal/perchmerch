"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { formatPrice } from "@/lib/utils"
import {
  Facebook,
  Instagram,
  Twitter,
  Link as LinkIcon,
  TrendingUp,
  DollarSign,
  Users,
  ShoppingCart
} from "lucide-react"

interface BrandAnalytics {
  id: string
  name: string
  totalSales: number
  totalEarnings: number
  orderCount: number
  affiliateCount: number
  conversionRate: number
  averageOrderValue: number
  salesTrend: {
    date: string
    sales: number
    orders: number
  }[]
  topAffiliates: {
    id: string
    name: string
    sales: number
    commission: number
  }[]
  socialMedia?: {
    facebook?: string
    instagram?: string
    twitter?: string
    website?: string
  }
}

interface BrandAnalyticsProps {
  brandId?: string // Optional - if provided, only shows analytics for this brand
}

export function BrandAnalytics({ brandId }: BrandAnalyticsProps) {
  const [analytics, setAnalytics] = useState<BrandAnalytics[]>([])
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState<"7d" | "30d" | "90d">("30d")
  const [isLoading, setIsLoading] = useState(true)

  const fetchAnalytics = async () => {
    try {
      const url = new URL("/api/admin/analytics/brands", window.location.origin)
      if (brandId) url.searchParams.set("brandId", brandId)
      url.searchParams.set("timeframe", timeframe)
      
      const response = await fetch(url.toString())
      const data = await response.json()
      
      if (data.success) {
        setAnalytics(data.analytics)
        if (data.analytics.length > 0 && !selectedBrand) {
          setSelectedBrand(data.analytics[0].id)
        }
      }
    } catch (error) {
      console.error("Error fetching analytics:", error)
      toast({
        title: "Error",
        description: "Failed to fetch analytics data",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [brandId, timeframe])

  const selectedAnalytics = analytics.find(a => a.id === selectedBrand)

  const handleSocialMediaUpdate = async (
    brandId: string,
    platform: keyof NonNullable<BrandAnalytics["socialMedia"]>,
    url: string
  ) => {
    try {
      const response = await fetch(`/api/admin/brands/${brandId}/social`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          url
        })
      })

      if (!response.ok) throw new Error("Failed to update social media link")

      toast({
        title: "Success",
        description: "Social media link updated"
      })

      fetchAnalytics()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update social media link",
        variant: "destructive"
      })
    }
  }

  if (isLoading) {
    return <div>Loading analytics...</div>
  }

  if (analytics.length === 0) {
    return <div>No analytics data available</div>
  }

  return (
    <div className="space-y-6">
      {!brandId && (
        <div className="flex gap-4 items-center">
          <Label>Select Brand:</Label>
          <select
            className="border rounded p-2"
            value={selectedBrand || ""}
            onChange={(e) => setSelectedBrand(e.target.value)}
          >
            {analytics.map(brand => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex gap-4">
        <Button
          variant={timeframe === "7d" ? "default" : "outline"}
          onClick={() => setTimeframe("7d")}
        >
          7 Days
        </Button>
        <Button
          variant={timeframe === "30d" ? "default" : "outline"}
          onClick={() => setTimeframe("30d")}
        >
          30 Days
        </Button>
        <Button
          variant={timeframe === "90d" ? "default" : "outline"}
          onClick={() => setTimeframe("90d")}
        >
          90 Days
        </Button>
      </div>

      {selectedAnalytics && (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          {/* Overview Cards */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Sales Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Sales</p>
                  <p className="text-2xl font-bold">
                    {formatPrice(selectedAnalytics.totalSales)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Earnings</p>
                  <p className="text-2xl font-bold">
                    {formatPrice(selectedAnalytics.totalEarnings)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Orders</p>
                  <p className="text-2xl font-bold">
                    {selectedAnalytics.orderCount}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Order Value</p>
                  <p className="text-2xl font-bold">
                    {formatPrice(selectedAnalytics.averageOrderValue)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Affiliate Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Affiliate Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Active Affiliates</p>
                  <p className="text-2xl font-bold">
                    {selectedAnalytics.affiliateCount}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Conversion Rate</p>
                  <p className="text-2xl font-bold">
                    {(selectedAnalytics.conversionRate * 100).toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="font-medium mb-2">Top Affiliates</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Affiliate</TableHead>
                      <TableHead>Sales</TableHead>
                      <TableHead>Commission</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedAnalytics.topAffiliates.map(affiliate => (
                      <TableRow key={affiliate.id}>
                        <TableCell>{affiliate.name}</TableCell>
                        <TableCell>{formatPrice(affiliate.sales)}</TableCell>
                        <TableCell>{formatPrice(affiliate.commission)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Sales Trend Chart */}
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Sales Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={selectedAnalytics.salesTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => new Date(date).toLocaleDateString()}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => formatPrice(value)}
                      labelFormatter={(date) => new Date(date).toLocaleDateString()}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="sales" 
                      stroke="#2563eb" 
                      name="Sales"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="orders" 
                      stroke="#16a34a" 
                      name="Orders"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Social Media Integration */}
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5" />
                Social Media Integration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Facebook Page</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      placeholder="Facebook URL"
                      value={selectedAnalytics.socialMedia?.facebook || ""}
                      onChange={(e) => handleSocialMediaUpdate(
                        selectedAnalytics.id,
                        "facebook",
                        e.target.value
                      )}
                    />
                    <Button size="icon">
                      <Facebook className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Instagram Profile</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      placeholder="Instagram URL"
                      value={selectedAnalytics.socialMedia?.instagram || ""}
                      onChange={(e) => handleSocialMediaUpdate(
                        selectedAnalytics.id,
                        "instagram",
                        e.target.value
                      )}
                    />
                    <Button size="icon">
                      <Instagram className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Twitter Profile</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      placeholder="Twitter URL"
                      value={selectedAnalytics.socialMedia?.twitter || ""}
                      onChange={(e) => handleSocialMediaUpdate(
                        selectedAnalytics.id,
                        "twitter",
                        e.target.value
                      )}
                    />
                    <Button size="icon">
                      <Twitter className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Website</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      placeholder="Website URL"
                      value={selectedAnalytics.socialMedia?.website || ""}
                      onChange={(e) => handleSocialMediaUpdate(
                        selectedAnalytics.id,
                        "website",
                        e.target.value
                      )}
                    />
                    <Button size="icon">
                      <LinkIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 