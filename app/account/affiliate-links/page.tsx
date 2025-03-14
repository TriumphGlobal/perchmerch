"use client"

import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { Copy, Link, TrendingUp } from "lucide-react"
import { formatPrice } from "@/lib/utils"

interface AffiliateLink {
  id: string
  brandId: string
  brandName: string
  status: string
  commissionRate: number
  totalSales: number
  totalDue: number
  totalPaid: number
  clickCount: number
  conversionRate: number
}

export default function AffiliateLinksPage() {
  const { user, isLoaded } = useUser()
  const [affiliateLinks, setAffiliateLinks] = useState<AffiliateLink[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isLoaded && user) {
      fetchAffiliateLinks()
    }
  }, [isLoaded, user])

  const fetchAffiliateLinks = async () => {
    try {
      const response = await fetch("/api/affiliates/links")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch affiliate links")
      }

      setAffiliateLinks(data)
    } catch (error) {
      console.error("Error fetching affiliate links:", error)
      toast({
        title: "Error",
        description: "Failed to load affiliate links",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyAffiliateLink = (brandId: string) => {
    const affiliateLink = `${window.location.origin}/brands/${brandId}?ref=${user?.id}`
    navigator.clipboard.writeText(affiliateLink)
    toast({
      title: "Copied!",
      description: "Affiliate link copied to clipboard"
    })
  }

  if (!isLoaded || isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">My Affiliate Links</h2>
        <p className="text-muted-foreground">
          Manage your affiliate links and track your earnings from each brand
        </p>
      </div>

      {affiliateLinks.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center space-y-4">
              <Link className="h-12 w-12 mx-auto text-muted-foreground" />
              <div className="space-y-2">
                <h3 className="text-lg font-medium">No Affiliate Links</h3>
                <p className="text-sm text-muted-foreground">
                  You haven't been approved as an affiliate for any brands yet.
                  Visit brand pages to apply for their affiliate programs.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {affiliateLinks.map((link) => (
            <Card key={link.id}>
              <CardHeader>
                <CardTitle>{link.brandName}</CardTitle>
                <CardDescription>
                  Commission Rate: {(link.commissionRate * 100).toFixed(1)}%
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      Total Sales
                    </div>
                    <div className="text-2xl font-bold">{link.totalSales}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      Total Earnings
                    </div>
                    <div className="text-2xl font-bold">
                      {formatPrice(link.totalDue + link.totalPaid)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      Conversion Rate
                    </div>
                    <div className="text-2xl font-bold">
                      {(link.conversionRate * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={`${window.location.origin}/brands/${link.brandId}?ref=${user?.id}`}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyAffiliateLink(link.brandId)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 