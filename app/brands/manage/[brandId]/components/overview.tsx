"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"

interface Stats {
  dailyVisitors: number
  monthlyVisitors: number
  totalProducts: number
  activeAffiliates: number
  pendingAffiliates: number
  recentOrders: any[]
  topProducts: any[]
  topAffiliates: any[]
}

interface OverviewProps {
  stats: Stats
}

export function Overview({ stats }: OverviewProps) {
  const chartData = [
    {
      name: "Jan",
      total: 1234,
    },
    {
      name: "Feb",
      total: 2234,
    },
    {
      name: "Mar",
      total: 3234,
    },
    {
      name: "Apr",
      total: 2734,
    },
    {
      name: "May",
      total: 3834,
    },
    {
      name: "Jun",
      total: 4534,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData}>
              <XAxis
                dataKey="name"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <Bar
                dataKey="total"
                fill="currentColor"
                radius={[4, 4, 0, 0]}
                className="fill-primary"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {stats.recentOrders.slice(0, 5).map((order, index) => (
              <div key={index} className="flex items-center">
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {order.customer}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {order.product}
                  </p>
                </div>
                <div className="ml-auto font-medium">
                  +${order.amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 