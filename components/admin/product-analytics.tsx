"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { formatPrice, formatDate } from "@/lib/utils"
import { Download, Calendar, TrendingUp, TrendingDown } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import * as XLSX from 'xlsx'

interface ProductAnalytics {
  id: string
  title: string
  totalViews: number
  totalClicks: number
  totalSales: number
  totalRevenue: number
  conversionRate: number
  variants: {
    id: string
    title: string
    totalSales: number
    totalRevenue: number
    inventory: number
  }[]
  dailyStats: {
    date: string
    views: number
    clicks: number
    sales: number
    revenue: number
  }[]
  topAffiliates: {
    affiliateId: string
    affiliateName: string
    sales: number
    revenue: number
  }[]
  inventoryValue: number
  averageOrderValue: number
  stockTurnoverRate: number
  profitMargin: number
}

interface ProductAnalyticsProps {
  productId?: string
  brandId?: string
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

export function ProductAnalytics({ productId, brandId }: ProductAnalyticsProps) {
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | 'custom'>('30d')
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>()
  const [analytics, setAnalytics] = useState<ProductAnalytics[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchAnalytics()
  }, [productId, brandId, timeframe, dateRange])

  const fetchAnalytics = async () => {
    try {
      const url = new URL('/api/admin/analytics/products', window.location.origin)
      if (productId) url.searchParams.set('productId', productId)
      if (brandId) url.searchParams.set('brandId', brandId)
      
      if (timeframe === 'custom' && dateRange) {
        url.searchParams.set('startDate', dateRange.from.toISOString())
        url.searchParams.set('endDate', dateRange.to.toISOString())
      } else {
        url.searchParams.set('timeframe', timeframe)
      }

      const response = await fetch(url.toString())
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch analytics')
      }

      setAnalytics(data.analytics)
    } catch (error) {
      console.error('Error fetching analytics:', error)
      toast({
        title: "Error",
        description: "Failed to fetch analytics data",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportData = () => {
    try {
      const exportData = analytics.map(product => ({
        'Product ID': product.id,
        'Product Title': product.title,
        'Total Views': product.totalViews,
        'Total Clicks': product.totalClicks,
        'Total Sales': product.totalSales,
        'Total Revenue': product.totalRevenue,
        'Conversion Rate': `${(product.conversionRate * 100).toFixed(2)}%`,
        'Average Order Value': product.averageOrderValue,
        'Inventory Value': product.inventoryValue,
        'Stock Turnover Rate': product.stockTurnoverRate,
        'Profit Margin': `${(product.profitMargin * 100).toFixed(2)}%`
      }))

      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(exportData)
      XLSX.utils.book_append_sheet(wb, ws, 'Product Analytics')

      const fileName = `product_analytics_${formatDate(new Date())}.xlsx`
      XLSX.writeFile(wb, fileName)

      toast({
        title: "Success",
        description: "Analytics data exported successfully"
      })
    } catch (error) {
      console.error('Error exporting data:', error)
      toast({
        title: "Error",
        description: "Failed to export analytics data",
        variant: "destructive"
      })
    }
  }

  const renderPerformanceMetrics = (product: ProductAnalytics) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="p-4">
          <CardTitle className="text-sm font-medium">Total Views</CardTitle>
          <CardDescription>
            {product.totalViews > 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-2xl font-bold">{product.totalViews}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="p-4">
          <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
          <CardDescription>
            vs. Industry Avg 2.5%
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-2xl font-bold">
            {(product.conversionRate * 100).toFixed(1)}%
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="p-4">
          <CardTitle className="text-sm font-medium">Revenue</CardTitle>
          <CardDescription>
            {formatPrice(product.averageOrderValue)} AOV
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-2xl font-bold">{formatPrice(product.totalRevenue)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="p-4">
          <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
          <CardDescription>
            {product.profitMargin > 0.2 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-2xl font-bold">
            {(product.profitMargin * 100).toFixed(1)}%
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderVariantPerformance = (product: ProductAnalytics) => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Variant Performance</CardTitle>
        <CardDescription>
          Sales and revenue by variant
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={product.variants}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="title" />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="totalSales" name="Sales" fill="#8884d8" />
                <Bar yAxisId="right" dataKey="totalRevenue" name="Revenue" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={product.variants}
                  dataKey="inventory"
                  nameKey="title"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {product.variants.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderDailyStats = (product: ProductAnalytics) => (
    <Card>
      <CardHeader>
        <CardTitle>Daily Performance</CardTitle>
        <CardDescription>
          Views, clicks, and sales over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={product.dailyStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="views" name="Views" stroke="#8884d8" />
              <Line yAxisId="left" type="monotone" dataKey="clicks" name="Clicks" stroke="#82ca9d" />
              <Line yAxisId="right" type="monotone" dataKey="sales" name="Sales" stroke="#ffc658" />
              <Line yAxisId="right" type="monotone" dataKey="revenue" name="Revenue" stroke="#ff7300" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )

  const renderTopAffiliates = (product: ProductAnalytics) => (
    <Card>
      <CardHeader>
        <CardTitle>Top Affiliates</CardTitle>
        <CardDescription>
          Best performing affiliates for this product
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={product.topAffiliates}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="affiliateName" />
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="sales" name="Sales" fill="#8884d8" />
              <Bar yAxisId="right" dataKey="revenue" name="Revenue" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )

  if (isLoading) {
    return <div>Loading analytics...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold">
          {productId ? 'Product Analytics' : 'Products Performance'}
        </h2>
        <div className="flex items-center gap-4">
          {timeframe === 'custom' ? (
            <DatePickerWithRange
              value={dateRange}
              onChange={setDateRange}
            />
          ) : (
            <Select
              value={timeframe}
              onValueChange={(value: '7d' | '30d' | '90d' | 'custom') => setTimeframe(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Button
            variant="outline"
            onClick={handleExportData}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {analytics.map(product => (
        <div key={product.id} className="space-y-6">
          {!productId && (
            <h3 className="text-xl font-semibold">{product.title}</h3>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="variants">Variants</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="affiliates">Affiliates</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              {renderPerformanceMetrics(product)}
            </TabsContent>

            <TabsContent value="variants">
              {renderVariantPerformance(product)}
            </TabsContent>

            <TabsContent value="trends">
              {renderDailyStats(product)}
            </TabsContent>

            <TabsContent value="affiliates">
              {renderTopAffiliates(product)}
            </TabsContent>
          </Tabs>
        </div>
      ))}
    </div>
  )
} 