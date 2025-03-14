"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/use-toast"
import { 
  Search, 
  MoreHorizontal, 
  Eye, 
  Trash, 
  Ban, 
  CheckCircle,
  ShoppingBag
} from "lucide-react"
import { AdminShell } from "@/components/admin/admin-shell"
import { processImageForBrand } from "@/lib/utils"

export default function AdminBrandsPage() {
  const { user, getAllBrands, deleteBrand } = useAuth()
  const router = useRouter()
  const [brands, setBrands] = useState<any[]>([])
  const [filteredBrands, setFilteredBrands] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  // Redirect if not admin
  useEffect(() => {
    if (!user?.isAdmin) {
      router.push("/")
    }
  }, [user, router])

  // Load all brands
  useEffect(() => {
    if (user?.isAdmin) {
      const allBrands = getAllBrands()
      setBrands(allBrands)
      setFilteredBrands(allBrands)
      setIsLoading(false)
    }
  }, [user, getAllBrands])

  // Filter brands based on search query
  useEffect(() => {
    if (searchQuery) {
      const filtered = brands.filter(brand => 
        brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        brand.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (brand.description && brand.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      setFilteredBrands(filtered)
    } else {
      setFilteredBrands(brands)
    }
  }, [searchQuery, brands])

  const handleDeleteBrand = async (brandId: string) => {
    try {
      await deleteBrand(brandId)
      
      // Update local state
      setBrands(prevBrands => prevBrands.filter(b => b.id !== brandId))
      
      toast({
        title: "Brand Deleted",
        description: "The brand has been deleted successfully."
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete brand",
        variant: "destructive"
      })
    }
  }

  const handleSuspendBrand = async (brandId: string) => {
    // In a real app, this would be an API call
    // For now, we'll just update local state
    try {
      // Update in local storage
      const brandsData = JSON.parse(localStorage.getItem('perchmerch_brands') || '{}')
      if (brandsData[brandId]) {
        brandsData[brandId].isActive = false
        localStorage.setItem('perchmerch_brands', JSON.stringify(brandsData))
        
        // Update local state
        setBrands(prevBrands => 
          prevBrands.map(b => 
            b.id === brandId ? { ...b, isActive: false } : b
          )
        )
        
        toast({
          title: "Brand Suspended",
          description: "The brand has been suspended successfully."
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to suspend brand",
        variant: "destructive"
      })
    }
  }

  const handleActivateBrand = async (brandId: string) => {
    // In a real app, this would be an API call
    // For now, we'll just update local state
    try {
      // Update in local storage
      const brandsData = JSON.parse(localStorage.getItem('perchmerch_brands') || '{}')
      if (brandsData[brandId]) {
        brandsData[brandId].isActive = true
        localStorage.setItem('perchmerch_brands', JSON.stringify(brandsData))
        
        // Update local state
        setBrands(prevBrands => 
          prevBrands.map(b => 
            b.id === brandId ? { ...b, isActive: true } : b
          )
        )
        
        toast({
          title: "Brand Activated",
          description: "The brand has been activated successfully."
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to activate brand",
        variant: "destructive"
      })
    }
  }

  const getOwnerUsername = (ownerId: string) => {
    try {
      const usersData = JSON.parse(localStorage.getItem('perchmerch_users') || '{}')
      const owner = Object.values(usersData).find((u: any) => u.id === ownerId)
      return owner ? (owner as any).username : "Unknown"
    } catch (error) {
      return "Unknown"
    }
  }

  const getProductCount = (brand: any) => {
    return brand.products ? brand.products.length : 0
  }

  if (!user?.isAdmin) {
    return null
  }

  return (
    <AdminShell>
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Manage Brands</h1>
        </div>

        <Card className="mb-8">
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search brands by name or description..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-8">Loading brands...</div>
            ) : filteredBrands.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No brands found matching your search criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Brand</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Products</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBrands.map((brand) => (
                      <TableRow key={brand.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 rounded-md overflow-hidden flex-shrink-0">
                              {brand.mainImage ? (
                                <Image 
                                  src={processImageForBrand(brand.mainImage)} 
                                  alt={brand.name} 
                                  fill 
                                  className="object-cover" 
                                  sizes="40px"
                                />
                              ) : (
                                <div className="w-full h-full bg-muted flex items-center justify-center">
                                  <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{brand.name}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {brand.description || "No description"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getOwnerUsername(brand.ownerId)}</TableCell>
                        <TableCell>
                          <span className="text-sm font-mono">{brand.id}</span>
                        </TableCell>
                        <TableCell>
                          {brand.isActive === false ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Suspended
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Active
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{getProductCount(brand)}</TableCell>
                        <TableCell>{brand.createdAt ? new Date(brand.createdAt).toLocaleDateString() : "N/A"}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => router.push(`/${brand.id}`)}>
                                <Eye className="mr-2 h-4 w-4" />
                                <span>View Brand</span>
                              </DropdownMenuItem>
                              {brand.isActive === false ? (
                                <DropdownMenuItem onClick={() => handleActivateBrand(brand.id)}>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  <span>Activate Brand</span>
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleSuspendBrand(brand.id)}>
                                  <Ban className="mr-2 h-4 w-4" />
                                  <span>Suspend Brand</span>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                onClick={() => handleDeleteBrand(brand.id)}
                                className="text-red-600"
                                disabled={brand.id === "demo-brand"}
                              >
                                <Trash className="mr-2 h-4 w-4" />
                                <span>Delete Brand</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </Card>
      </div>
    </AdminShell>
  )
} 