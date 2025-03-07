"use client"

import * as React from "react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Line, LineChart } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency } from "@/lib/utils"

interface BrandDashboardProps {
  brand: {
    id: string
    name: string
    totalSales: number
    totalEarnings: number // This is brand's 50% share
  }
  recentOrders: Array<{
    id: string
    createdAt: string
    totalAmount: number
    brandEarnings: number
    affiliateId?: string
    affiliateDue?: number
  }>
  affiliates: Array<{
    id: string
    user: {
      name: string
      email: string
    }
    commissionRate: number
    totalSales: number
    totalDue: number
    clickCount: number
  }>
  dailyStats: Array<{
    date: string
    sales: number
    earnings: number
    affiliateSales: number
  }>
}

export function BrandDashboard({ brand, recentOrders, affiliates, dailyStats }: BrandDashboardProps) {
  const { toast } = useToast()

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(brand.totalSales)}</div>
            <p className="text-xs text-muted-foreground">
              Gross sales across all channels
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(brand.totalEarnings)}</div>
            <p className="text-xs text-muted-foreground">
              Your 50% share of total sales
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Affiliate Due</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(affiliates.reduce((sum, aff) => sum + aff.totalDue, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              Total owed to affiliates from your earnings
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                brand.totalEarnings - affiliates.reduce((sum, aff) => sum + aff.totalDue, 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Your earnings after affiliate commissions
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="affiliates">Affiliates</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sales Overview</CardTitle>
              <CardDescription>Daily sales and earnings breakdown</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyStats}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="#0ea5e9" 
                    name="Total Sales" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="earnings" 
                    stroke="#22c55e" 
                    name="Your Earnings" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="affiliateSales" 
                    stroke="#f59e0b" 
                    name="Affiliate Sales" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Your latest sales and commissions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Order Total</TableHead>
                    <TableHead>Your Earnings</TableHead>
                    <TableHead>Affiliate</TableHead>
                    <TableHead>Affiliate Due</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
                      <TableCell>{formatCurrency(order.brandEarnings)}</TableCell>
                      <TableCell>
                        {order.affiliateId ? "Yes" : "Direct Sale"}
                      </TableCell>
                      <TableCell>
                        {order.affiliateDue 
                          ? formatCurrency(order.affiliateDue)
                          : "-"
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="affiliates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Affiliate Performance</CardTitle>
              <CardDescription>Track your affiliate sales and commissions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Affiliate</TableHead>
                    <TableHead>Commission Rate</TableHead>
                    <TableHead>Total Sales</TableHead>
                    <TableHead>Amount Due</TableHead>
                    <TableHead>Clicks</TableHead>
                    <TableHead>Conversion Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {affiliates.map((affiliate) => (
                    <TableRow key={affiliate.id}>
                      <TableCell>
                        {affiliate.user.name}
                        <br />
                        <span className="text-sm text-muted-foreground">
                          {affiliate.user.email}
                        </span>
                      </TableCell>
                      <TableCell>{(affiliate.commissionRate * 100).toFixed(0)}%</TableCell>
                      <TableCell>{formatCurrency(affiliate.totalSales)}</TableCell>
                      <TableCell>{formatCurrency(affiliate.totalDue)}</TableCell>
                      <TableCell>{affiliate.clickCount}</TableCell>
                      <TableCell>
                        {((affiliate.totalSales / (affiliate.clickCount || 1)) * 100).toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Affiliate Sales Distribution</CardTitle>
              <CardDescription>Sales breakdown by affiliate</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={affiliates}>
                  <XAxis 
                    dataKey="user.name" 
                    tickFormatter={(value) => value.split(' ')[0]}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar 
                    dataKey="totalSales" 
                    fill="#0ea5e9" 
                    name="Total Sales"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 