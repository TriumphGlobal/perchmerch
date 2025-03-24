"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Order {
  id: string
  customer: string
  product: string
  amount: number
  status: "pending" | "processing" | "completed" | "cancelled"
  date: string
}

interface RecentActivityProps {
  orders: Order[]
}

export function RecentActivity({ orders }: RecentActivityProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Orders</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-8">
            {orders.map((order) => (
              <div key={order.id} className="flex items-center">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {order.customer}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {order.product}
                  </p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-sm font-medium">
                    ${order.amount.toFixed(2)}
                  </p>
                  <div className="text-xs text-muted-foreground">
                    {new Date(order.date).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
} 