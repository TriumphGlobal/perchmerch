"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Affiliate {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  totalSales: number
  totalRevenue: number
  totalClicks: number
  conversionRate: number
  status: "active" | "pending" | "inactive"
}

interface TopAffiliatesProps {
  affiliates: Affiliate[]
}

export function TopAffiliates({ affiliates }: TopAffiliatesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Affiliates</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-8">
            {affiliates.map((affiliate) => (
              <div key={affiliate.id} className="flex items-center">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={affiliate.avatarUrl || ""} alt={affiliate.name} />
                  <AvatarFallback>
                    {affiliate.name.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {affiliate.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {affiliate.email}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={
                        affiliate.status === "active" 
                          ? "default"
                          : affiliate.status === "pending"
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {affiliate.status}
                    </Badge>
                    <Badge variant="secondary">
                      {affiliate.totalSales} sales
                    </Badge>
                  </div>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-sm font-medium">
                    ${affiliate.totalRevenue.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(affiliate.conversionRate * 100).toFixed(1)}% conversion
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {affiliate.totalClicks} clicks
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
} 