"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Brand } from "@prisma/client"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"

interface OverviewProps {
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

const data = [
  {
    name: "Jan",
    total: Math.floor(Math.random() * 5000)
  },
  {
    name: "Feb",
    total: Math.floor(Math.random() * 5000)
  },
  {
    name: "Mar",
    total: Math.floor(Math.random() * 5000)
  },
  {
    name: "Apr",
    total: Math.floor(Math.random() * 5000)
  },
  {
    name: "May",
    total: Math.floor(Math.random() * 5000)
  },
  {
    name: "Jun",
    total: Math.floor(Math.random() * 5000)
  },
  {
    name: "Jul",
    total: Math.floor(Math.random() * 5000)
  },
  {
    name: "Aug",
    total: Math.floor(Math.random() * 5000)
  },
  {
    name: "Sep",
    total: Math.floor(Math.random() * 5000)
  },
  {
    name: "Oct",
    total: Math.floor(Math.random() * 5000)
  },
  {
    name: "Nov",
    total: Math.floor(Math.random() * 5000)
  },
  {
    name: "Dec",
    total: Math.floor(Math.random() * 5000)
  }
]

export function Overview({ brand }: OverviewProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Revenue Overview</CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data}>
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
          <CardDescription>
            Latest updates from your brand
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {brand.products.slice(0, 5).map((product) => (
              <div key={product.id} className="flex items-center">
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {product.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Added on {new Date(product.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="ml-auto font-medium">
                  ${product.price?.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 