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
  Star, 
  MoreVertical, 
  Ban, 
  Trash2, 
  Eye, 
  CheckCircle, 
  XCircle 
} from "lucide-react"

interface Brand {
  id: string
  name: string
  brandId: string
  isApproved: boolean
  isFeatured: boolean
  isDeleted: boolean
  isHidden: boolean
  totalSales: number
  totalEarnings: number
  createdAt: string
  deletedAt?: string
  deletedBy?: string
  originalUserId?: string
  owner: {
    id: string
    name: string | null
    email: string
  }
  productCount: number
  hiddenProductCount: number
  featuredUntil: string | null
}

export function BrandsList() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  const fetchBrands = async () => {
    try {
      const response = await fetch("/api/admin/brands")
      const data = await response.json()
      if (data.success) {
        setBrands(data.brands)
      }
    } catch (error) {
      console.error("Error fetching brands:", error)
      toast({
        title: "Error",
        description: "Failed to fetch brands",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBrands()
  }, [])

  const handleDelete = async (brandId: string) => {
    if (!confirm("Are you sure you want to delete this brand? This action will hide all products but can be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/brands/${brandId}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        throw new Error("Failed to delete brand")
      }

      toast({
        title: "Success",
        description: "Brand has been deleted"
      })

      // Refresh the brands list
      fetchBrands()
    } catch (error) {
      console.error("Error deleting brand:", error)
      toast({
        title: "Error",
        description: "Failed to delete brand",
        variant: "destructive"
      })
    }
  }

  const handleToggleFeatured = async (brandId: string, isFeatured: boolean) => {
    try {
      const response = await fetch(`/api/admin/brands/${brandId}/feature`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ isFeatured: !isFeatured })
      })

      if (!response.ok) {
        throw new Error("Failed to update featured status")
      }

      toast({
        title: "Success",
        description: `Brand has been ${!isFeatured ? "featured" : "unfeatured"}`
      })

      // Refresh the brands list
      fetchBrands()
    } catch (error) {
      console.error("Error updating featured status:", error)
      toast({
        title: "Error",
        description: "Failed to update featured status",
        variant: "destructive"
      })
    }
  }

  const handleTemporaryBan = async (brandId: string) => {
    try {
      const response = await fetch(`/api/admin/brands/${brandId}/ban`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          action: "temporary",
          reason: prompt("Enter reason for temporary ban:") || "No reason provided"
        })
      })

      if (!response.ok) {
        throw new Error("Failed to ban brand")
      }

      toast({
        title: "Success",
        description: "Brand has been temporarily banned"
      })

      // Refresh the brands list
      fetchBrands()
    } catch (error) {
      console.error("Error banning brand:", error)
      toast({
        title: "Error",
        description: "Failed to ban brand",
        variant: "destructive"
      })
    }
  }

  const handleRestore = async (brandId: string) => {
    try {
      const response = await fetch(`/api/admin/brands/${brandId}/restore`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      })

      if (!response.ok) {
        throw new Error("Failed to restore brand")
      }

      toast({
        title: "Success",
        description: "Brand has been restored"
      })

      fetchBrands()
    } catch (error) {
      console.error("Error restoring brand:", error)
      toast({
        title: "Error",
        description: "Failed to restore brand",
        variant: "destructive"
      })
    }
  }

  const filteredBrands = brands.filter(brand => 
    brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    brand.brandId.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Brands</CardTitle>
        <div className="mt-4">
          <Input
            placeholder="Search brands..."
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
              <TableHead>Brand Name</TableHead>
              <TableHead>Brand ID</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total Sales</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">Loading brands...</TableCell>
              </TableRow>
            ) : filteredBrands.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">No brands found</TableCell>
              </TableRow>
            ) : (
              filteredBrands.map((brand) => (
                <TableRow key={brand.id} className={brand.isHidden ? "opacity-60" : ""}>
                  <TableCell className="font-medium">
                    {brand.name}
                    {brand.isFeatured && (
                      <Badge variant="secondary" className="ml-2">
                        <Star className="h-3 w-3 text-yellow-500 mr-1" />
                        Featured
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{brand.brandId}</TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {brand.owner.email}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {brand.isDeleted ? (
                        <Badge variant="destructive">Deleted</Badge>
                      ) : brand.isHidden ? (
                        <Badge variant="warning">Hidden</Badge>
                      ) : brand.isApproved ? (
                        <Badge variant="success">Approved</Badge>
                      ) : (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                      {brand.isFeatured && brand.featuredUntil && (
                        <span className="text-xs text-muted-foreground">
                          Featured until {new Date(brand.featuredUntil).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col">
                      <span>${brand.totalSales.toFixed(2)}</span>
                      <span className="text-xs text-muted-foreground">
                        Earnings: ${brand.totalEarnings.toFixed(2)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{brand.productCount} total</span>
                      {brand.hiddenProductCount > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {brand.hiddenProductCount} hidden
                        </span>
                      )}
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
                        <DropdownMenuItem onClick={() => window.location.href = `/brands/${brand.brandId}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Brand
                        </DropdownMenuItem>
                        {!brand.isDeleted && (
                          <>
                            <DropdownMenuItem 
                              onClick={() => handleToggleFeatured(brand.id, brand.isFeatured)}
                            >
                              <Star className="h-4 w-4 mr-2" />
                              {brand.isFeatured ? "Unfeature" : "Feature"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleTemporaryBan(brand.id)}>
                              <Ban className="h-4 w-4 mr-2" />
                              Temporary Ban
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(brand.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                        {brand.isDeleted && (
                          <DropdownMenuItem onClick={() => handleRestore(brand.id)}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Restore Brand
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
    </Card>
  )
} 