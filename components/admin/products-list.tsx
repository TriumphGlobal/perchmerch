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
  Edit2,
  Trash2,
  CheckCircle
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { formatPrice } from "@/lib/utils"

interface Product {
  id: string
  title: string
  price: number
  isHidden: boolean
  isDeleted: boolean
  brandId: string
  brand: {
    name: string
    brandId: string
  }
  createdAt: string
  updatedAt: string
}

interface ProductsListProps {
  brandId?: string // Optional - if provided, only shows products for this brand
}

export function ProductsList({ brandId }: ProductsListProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [includeHidden, setIncludeHidden] = useState(false)

  const fetchProducts = async () => {
    try {
      const url = brandId 
        ? `/api/brands/${brandId}/products?includeHidden=${includeHidden}`
        : `/api/admin/products?includeHidden=${includeHidden}`
      
      const response = await fetch(url)
      const data = await response.json()
      if (data.success) {
        setProducts(data.products)
      }
    } catch (error) {
      console.error("Error fetching products:", error)
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [brandId, includeHidden])

  const handleToggleVisibility = async (productId: string, isHidden: boolean) => {
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ isHidden: !isHidden })
      })

      if (!response.ok) {
        throw new Error("Failed to update product visibility")
      }

      toast({
        title: "Success",
        description: `Product has been ${!isHidden ? "hidden" : "shown"}`
      })

      fetchProducts()
    } catch (error) {
      console.error("Error updating product visibility:", error)
      toast({
        title: "Error",
        description: "Failed to update product visibility",
        variant: "destructive"
      })
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        throw new Error("Failed to delete product")
      }

      toast({
        title: "Success",
        description: "Product has been deleted"
      })

      fetchProducts()
    } catch (error) {
      console.error("Error deleting product:", error)
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive"
      })
    }
  }

  const filteredProducts = products.filter(product => 
    product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.brand.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Products</CardTitle>
          <Button
            variant="outline"
            onClick={() => setIncludeHidden(!includeHidden)}
          >
            {includeHidden ? "Hide Hidden Products" : "Show Hidden Products"}
          </Button>
        </div>
        <div className="mt-4">
          <Input
            placeholder="Search products..."
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
              <TableHead>Product</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">Loading products...</TableCell>
              </TableRow>
            ) : filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">No products found</TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <TableRow key={product.id} className={product.isHidden ? "opacity-60" : ""}>
                  <TableCell className="font-medium">{product.title}</TableCell>
                  <TableCell>
                    <a 
                      href={`/brands/${product.brand.brandId}`}
                      className="text-blue-600 hover:underline"
                    >
                      {product.brand.name}
                    </a>
                  </TableCell>
                  <TableCell>{formatPrice(product.price)}</TableCell>
                  <TableCell>
                    <Badge variant={product.isHidden ? "secondary" : "success"}>
                      {product.isHidden ? "Hidden" : "Visible"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(product.updatedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => window.location.href = `/products/${product.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleVisibility(product.id, product.isHidden)}>
                          {product.isHidden ? (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Show Product
                            </>
                          ) : (
                            <>
                              <Ban className="h-4 w-4 mr-2" />
                              Hide Product
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Product
                        </DropdownMenuItem>
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