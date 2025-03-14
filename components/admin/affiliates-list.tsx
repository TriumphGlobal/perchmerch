"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/use-toast"
import { 
  MoreVertical, 
  Ban, 
  Eye, 
  CheckCircle,
  XCircle,
  DollarSign
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { formatPrice } from "@/lib/utils"

interface Affiliate {
  id: string
  user: {
    name: string | null
    email: string
  }
  brand: {
    name: string
    brandId: string
  }
  status: string
  commissionRate: number
  totalSales: number
  totalDue: number
  totalPaid: number
  clickCount: number
  metrics: {
    conversionRate: number
    averageOrderValue: number
    pendingPayout: number
  }
  orders: {
    id: string
    totalAmount: number
    affiliateDue: number
    createdAt: string
  }[]
  createdAt: string
  updatedAt: string
  banReason?: string
  banExpiresAt?: string
  rejectionReason?: string
}

interface AffiliatesListProps {
  brandId?: string // Optional - if provided, only shows affiliates for this brand
}

export function AffiliatesList({ brandId }: AffiliatesListProps) {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<string>("")
  const [actionDialog, setActionDialog] = useState<{
    isOpen: boolean
    affiliateId: string
    action: "approve" | "reject" | "ban" | "unban"
  }>({
    isOpen: false,
    affiliateId: "",
    action: "approve"
  })
  const [actionReason, setActionReason] = useState("")
  const [banDuration, setBanDuration] = useState(7)

  const fetchAffiliates = async () => {
    try {
      const url = new URL("/api/admin/affiliates", window.location.origin)
      if (brandId) url.searchParams.set("brandId", brandId)
      if (selectedStatus) url.searchParams.set("status", selectedStatus)
      
      const response = await fetch(url)
      const data = await response.json()
      if (data.success) {
        setAffiliates(data.affiliates)
      }
    } catch (error) {
      console.error("Error fetching affiliates:", error)
      toast({
        title: "Error",
        description: "Failed to fetch affiliates",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAffiliates()
  }, [brandId, selectedStatus])

  const handleAction = async () => {
    try {
      const response = await fetch(`/api/admin/affiliates/${actionDialog.affiliateId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: actionDialog.action,
          reason: actionReason,
          banDuration: actionDialog.action === "ban" ? banDuration : undefined
        })
      })

      if (!response.ok) {
        throw new Error("Failed to perform action")
      }

      toast({
        title: "Success",
        description: `Affiliate has been ${actionDialog.action}ed`
      })

      setActionDialog({ isOpen: false, affiliateId: "", action: "approve" })
      setActionReason("")
      setBanDuration(7)
      fetchAffiliates()
    } catch (error) {
      console.error("Error performing action:", error)
      toast({
        title: "Error",
        description: "Failed to perform action",
        variant: "destructive"
      })
    }
  }

  const handleUpdateCommission = async (affiliateId: string, newRate: number) => {
    try {
      const response = await fetch(`/api/admin/affiliates/${affiliateId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          commissionRate: newRate
        })
      })

      if (!response.ok) {
        throw new Error("Failed to update commission rate")
      }

      toast({
        title: "Success",
        description: "Commission rate updated"
      })

      fetchAffiliates()
    } catch (error) {
      console.error("Error updating commission:", error)
      toast({
        title: "Error",
        description: "Failed to update commission rate",
        variant: "destructive"
      })
    }
  }

  const filteredAffiliates = affiliates.filter(affiliate => 
    affiliate.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    affiliate.brand.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "APPROVED": return "success"
      case "PENDING": return "warning"
      case "REJECTED": return "destructive"
      case "BANNED": return "destructive"
      default: return "secondary"
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Affiliates</CardTitle>
          <div className="flex gap-2">
            <select
              className="border rounded p-2"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="BANNED">Banned</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <Input
            placeholder="Search affiliates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Affiliate</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Commission</TableHead>
              <TableHead>Performance</TableHead>
              <TableHead>Earnings</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">Loading affiliates...</TableCell>
              </TableRow>
            ) : filteredAffiliates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">No affiliates found</TableCell>
              </TableRow>
            ) : (
              filteredAffiliates.map((affiliate) => (
                <TableRow key={affiliate.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {affiliate.user.name || affiliate.user.email}
                      </span>
                      {affiliate.user.name && (
                        <span className="text-sm text-muted-foreground">
                          {affiliate.user.email}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <a 
                      href={`/brands/${affiliate.brand.brandId}`}
                      className="text-blue-600 hover:underline"
                    >
                      {affiliate.brand.name}
                    </a>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(affiliate.status)}>
                      {affiliate.status}
                    </Badge>
                    {affiliate.banExpiresAt && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Ban expires: {new Date(affiliate.banExpiresAt).toLocaleDateString()}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {(affiliate.commissionRate * 100).toFixed(1)}%
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>
                        {affiliate.metrics.conversionRate.toFixed(1)}% CR
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {affiliate.clickCount} clicks
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{formatPrice(affiliate.totalSales)} sales</span>
                      <span className="text-sm text-muted-foreground">
                        {formatPrice(affiliate.metrics.pendingPayout)} pending
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => window.location.href = `/affiliates/${affiliate.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        {affiliate.status === "PENDING" && (
                          <>
                            <DropdownMenuItem 
                              onClick={() => setActionDialog({
                                isOpen: true,
                                affiliateId: affiliate.id,
                                action: "approve"
                              })}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setActionDialog({
                                isOpen: true,
                                affiliateId: affiliate.id,
                                action: "reject"
                              })}
                              className="text-red-600"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </DropdownMenuItem>
                          </>
                        )}
                        {affiliate.status === "APPROVED" && (
                          <DropdownMenuItem 
                            onClick={() => setActionDialog({
                              isOpen: true,
                              affiliateId: affiliate.id,
                              action: "ban"
                            })}
                            className="text-red-600"
                          >
                            <Ban className="h-4 w-4 mr-2" />
                            Temporary Ban
                          </DropdownMenuItem>
                        )}
                        {affiliate.status === "BANNED" && (
                          <DropdownMenuItem 
                            onClick={() => setActionDialog({
                              isOpen: true,
                              affiliateId: affiliate.id,
                              action: "unban"
                            })}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Remove Ban
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog 
        open={actionDialog.isOpen} 
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setActionDialog({ isOpen: false, affiliateId: "", action: "approve" })
            setActionReason("")
            setBanDuration(7)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.action === "approve" ? "Approve Affiliate" :
               actionDialog.action === "reject" ? "Reject Affiliate" :
               actionDialog.action === "ban" ? "Temporary Ban Affiliate" :
               "Remove Affiliate Ban"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {(actionDialog.action === "reject" || actionDialog.action === "ban") && (
              <div className="space-y-2">
                <Label>Reason</Label>
                <Textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder={`Enter ${actionDialog.action} reason...`}
                />
              </div>
            )}
            {actionDialog.action === "ban" && (
              <div className="space-y-2">
                <Label>Ban Duration (days)</Label>
                <Input
                  type="number"
                  min="1"
                  max="365"
                  value={banDuration}
                  onChange={(e) => setBanDuration(parseInt(e.target.value))}
                />
              </div>
            )}
            <Button 
              onClick={handleAction}
              disabled={
                (actionDialog.action === "reject" || actionDialog.action === "ban") && 
                !actionReason
              }
            >
              Confirm {actionDialog.action}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
} 