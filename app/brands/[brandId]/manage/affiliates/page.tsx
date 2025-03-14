"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { formatPrice } from "@/lib/utils"
import { Check, X, AlertTriangle } from "lucide-react"

interface BrandAffiliate {
  id: string
  userId: string
  userName: string
  email: string
  status: string
  commissionRate: number
  totalSales: number
  totalDue: number
  totalPaid: number
  clickCount: number
  conversionRate: number
  createdAt: string
}

export default function BrandAffiliatesPage() {
  const params = useParams()
  const [affiliates, setAffiliates] = useState<BrandAffiliate[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchAffiliates()
  }, [])

  const fetchAffiliates = async () => {
    try {
      const response = await fetch(`/api/brands/${params.brandId}/affiliates`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch affiliates")
      }

      setAffiliates(data)
    } catch (error) {
      console.error("Error fetching affiliates:", error)
      toast({
        title: "Error",
        description: "Failed to load affiliates",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (affiliateId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/brands/${params.brandId}/affiliates/${affiliateId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: newStatus })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update affiliate status")
      }

      // Refresh the affiliates list
      fetchAffiliates()

      toast({
        title: "Success",
        description: "Affiliate status updated successfully"
      })
    } catch (error) {
      console.error("Error updating affiliate status:", error)
      toast({
        title: "Error",
        description: "Failed to update affiliate status",
        variant: "destructive"
      })
    }
  }

  const columns: ColumnDef<BrandAffiliate>[] = [
    {
      accessorKey: "userName",
      header: "Affiliate",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.userName}</div>
          <div className="text-sm text-muted-foreground">{row.original.email}</div>
        </div>
      )
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status
        return (
          <div className="flex items-center gap-2">
            {status === "APPROVED" && <Check className="w-4 h-4 text-green-500" />}
            {status === "REJECTED" && <X className="w-4 h-4 text-red-500" />}
            {status === "PENDING" && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
            {status}
          </div>
        )
      }
    },
    {
      accessorKey: "totalSales",
      header: "Sales",
    },
    {
      accessorKey: "totalDue",
      header: "Due",
      cell: ({ row }) => formatPrice(row.original.totalDue)
    },
    {
      accessorKey: "conversionRate",
      header: "Conv. Rate",
      cell: ({ row }) => `${(row.original.conversionRate * 100).toFixed(1)}%`
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const affiliate = row.original
        if (affiliate.status === "PENDING") {
          return (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange(affiliate.id, "APPROVED")}
              >
                Approve
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange(affiliate.id, "REJECTED")}
              >
                Reject
              </Button>
            </div>
          )
        }
        return null
      }
    }
  ]

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Brand Affiliates</h2>
        <p className="text-muted-foreground">
          Manage your brand's affiliate partners and track their performance
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Affiliate Performance</CardTitle>
          <CardDescription>
            View and manage all affiliate partners for your brand
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={affiliates}
            searchKey="userName"
          />
        </CardContent>
      </Card>
    </div>
  )
} 