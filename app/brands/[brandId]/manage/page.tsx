"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { processImageForBrand, processImageForProduct } from "@/lib/utils"
import { 
  PlusCircle, 
  Trash2, 
  Save, 
  ImagePlus, 
  Edit, 
  X, 
  Users, 
  LineChart, 
  DollarSign, 
  Link as LinkIcon,
  Copy,
  UserPlus,
  AlertCircle
} from "lucide-react"
import { ImageUpload } from "@/components/image-upload"
import { prisma } from "@/lib/prisma"

interface Product {
  id: string
  name: string
  description: string
  price: number
  image: string
}

interface Affiliate {
  id: string
  name: string
  email: string
  commission: number
  sales: number
  revenue: number
  status: "active" | "pending" | "inactive"
  dateJoined: string
}

export default function BrandManagePage({ params }: { params: { brandId: string } }) {
  const { brandId } = params
  const { user, canManageBrand, getAllBrands, updateBrandProducts, updateBrandDetails } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [brand, setBrand] = useState<any>(null)
  const [brandName, setBrandName] = useState("")
  const [brandDescription, setBrandDescription] = useState("")
  const [brandImage, setBrandImage] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: "",
    description: "",
    price: 0,
    image: "https://placehold.co/300x400.jpg"
  })
  
  // Dashboard data
  const [totalSales, setTotalSales] = useState(0)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalVisitors, setTotalVisitors] = useState(0)
  const [conversionRate, setConversionRate] = useState(0)
  
  // Affiliate data
  const [affiliates, setAffiliates] = useState<Affiliate[]>([
    {
      id: "aff1",
      name: "John Smith",
      email: "john@example.com",
      commission: 10,
      sales: 24,
      revenue: 1250.50,
      status: "active",
      dateJoined: "2023-06-15"
    },
    {
      id: "aff2",
      name: "Sarah Johnson",
      email: "sarah@example.com",
      commission: 15,
      sales: 18,
      revenue: 890.75,
      status: "active",
      dateJoined: "2023-07-22"
    },
    {
      id: "aff3",
      name: "Michael Brown",
      email: "michael@example.com",
      commission: 10,
      sales: 5,
      revenue: 210.25,
      status: "pending",
      dateJoined: "2023-09-10"
    }
  ])
  const [newAffiliateName, setNewAffiliateName] = useState("")
  const [newAffiliateEmail, setNewAffiliateEmail] = useState("")
  const [newAffiliateCommission, setNewAffiliateCommission] = useState(10)

  useEffect(() => {
    // Check if user can manage this brand
    if (!canManageBrand(brandId)) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to manage this brand",
        variant: "destructive"
      })
      router.push(`/${brandId}`)
      return
    }

    // Load brand data
    const allBrands = getAllBrands()
    const currentBrand = allBrands.find(b => b.id === brandId)
    
    if (currentBrand) {
      setBrand(currentBrand)
      setBrandName(currentBrand.name)
      setBrandDescription(currentBrand.description || "")
      setBrandImage(currentBrand.mainImage || "")
      
      // Initialize with actual products from the database
      if (currentBrand.products) {
        setProducts(currentBrand.products)
      }
      
      // Load real dashboard data from the database
      const loadDashboardData = async () => {
        try {
          const dashboardData = await prisma.brand.findUnique({
            where: { id: currentBrand.id },
            select: {
              totalSales: true,
              totalEarnings: true,
              _count: {
                select: {
                  orders: true
                }
              },
              orders: {
                select: {
                  totalAmount: true,
                  createdAt: true
                },
                orderBy: {
                  createdAt: 'desc'
                },
                take: 10
              }
            }
          })

          if (dashboardData) {
            setTotalSales(dashboardData._count.orders)
            setTotalRevenue(dashboardData.totalEarnings)
            // Calculate other metrics
            const visitorsCount = await prisma.analytics.count({
              where: {
                brandId: currentBrand.id,
                event: 'PAGE_VIEW'
              }
            })
            setTotalVisitors(visitorsCount)
            setConversionRate(
              visitorsCount > 0 
                ? ((dashboardData._count.orders / visitorsCount) * 100).toFixed(1)
                : 0
            )
          }
        } catch (error) {
          console.error('Error loading dashboard data:', error)
        }
      }

      loadDashboardData()
    }
    
    setLoading(false)
  }, [brandId, canManageBrand, getAllBrands, router])

  const handleBrandImageFileUpload = async (file: File) => {
    try {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a JPG, PNG, or WebP file",
          variant: "destructive"
        })
        return
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024
      if (file.size > maxSize) {
        toast({
          title: "File Too Large",
          description: "Image must be smaller than 5MB",
          variant: "destructive"
        })
        return
      }

      // Create object URL for the image
      const objectUrl = URL.createObjectURL(file)
      setBrandImage(objectUrl)

      // Update brand details with the new image
      await handleSaveBrandDetails()
    } catch (error: any) {
      console.error('Error:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to upload image",
        variant: "destructive"
      })
    }
  }

  const handleSaveBrandDetails = async () => {
    try {
      // Process the brand image if it exists
      const processedImage = brandImage ? processImageForBrand(brandImage) : ""

      await updateBrandDetails(brand.id, {
        name: brandName,
        description: brandDescription,
        mainImage: processedImage
      })

      toast({
        title: "Success",
        description: "Brand details updated successfully"
      })
    } catch (error: any) {
      console.error('Error:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to update brand details",
        variant: "destructive"
      })
    }
  }

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.description || !newProduct.price) {
      toast({
        title: "Missing Information",
        description: "Please fill in all product details",
        variant: "destructive"
      })
      return
    }

    const product: Product = {
      id: crypto.randomUUID(),
      name: newProduct.name || "",
      description: newProduct.description || "",
      price: newProduct.price || 0,
      image: newProduct.image || "https://placehold.co/300x400.jpg"
    }

    const updatedProducts = [...products, product]
    setProducts(updatedProducts)
    
    // Update the brand products in the global context
    if (brand) {
      updateBrandProducts(brand.id, updatedProducts)
        .catch(error => {
          toast({
            title: "Error",
            description: error.message || "Failed to update products",
            variant: "destructive"
          })
        })
    }
    
    setNewProduct({
      name: "",
      description: "",
      price: 0,
      image: "https://placehold.co/300x400.jpg"
    })

    toast({
      title: "Product Added",
      description: "Your new product has been added to the store"
    })
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
  }

  const handleUpdateProduct = () => {
    if (!editingProduct) return

    const updatedProducts = products.map(p => 
      p.id === editingProduct.id ? editingProduct : p
    )
    
    setProducts(updatedProducts)
    
    // Update the brand products in the global context
    if (brand) {
      updateBrandProducts(brand.id, updatedProducts)
        .catch(error => {
          toast({
            title: "Error",
            description: error.message || "Failed to update products",
            variant: "destructive"
          })
        })
    }
    
    setEditingProduct(null)
    
    toast({
      title: "Product Updated",
      description: "Your product has been updated"
    })
  }

  const handleDeleteProduct = (productId: string) => {
    const updatedProducts = products.filter(p => p.id !== productId)
    setProducts(updatedProducts)
    
    // Update the brand products in the global context
    if (brand) {
      updateBrandProducts(brand.id, updatedProducts)
        .catch(error => {
          toast({
            title: "Error",
            description: error.message || "Failed to update products",
            variant: "destructive"
          })
        })
    }
    
    toast({
      title: "Product Deleted",
      description: "Your product has been removed from the store"
    })
  }

  const handleCancelEdit = () => {
    setEditingProduct(null)
  }
  
  const handleAddAffiliate = () => {
    if (!newAffiliateName || !newAffiliateEmail) {
      toast({
        title: "Missing Information",
        description: "Please fill in all affiliate details",
        variant: "destructive"
      })
      return
    }
    
    const newAffiliate: Affiliate = {
      id: crypto.randomUUID(),
      name: newAffiliateName,
      email: newAffiliateEmail,
      commission: newAffiliateCommission,
      sales: 0,
      revenue: 0,
      status: "pending",
      dateJoined: new Date().toISOString().split('T')[0]
    }
    
    setAffiliates([...affiliates, newAffiliate])
    setNewAffiliateName("")
    setNewAffiliateEmail("")
    setNewAffiliateCommission(10)
    
    toast({
      title: "Affiliate Invited",
      description: "An invitation has been sent to the new affiliate"
    })
  }
  
  const handleCopyAffiliateLink = () => {
    const affiliateLink = `https://perchmerch.com/${brandId}?ref=affiliate`
    navigator.clipboard.writeText(affiliateLink)
    
    toast({
      title: "Link Copied",
      description: "Affiliate link copied to clipboard"
    })
  }

  // Add a function to handle file uploads for product images
  const handleProductImageFileUpload = (file: File, isNewProduct: boolean, productId?: string) => {
    // In a real app, you would upload this file to a storage service
    // For now, we'll just use the object URL
    const objectUrl = URL.createObjectURL(file)
    
    if (isNewProduct) {
      setNewProduct({...newProduct, image: objectUrl})
    } else if (productId && editingProduct) {
      setEditingProduct({...editingProduct, image: objectUrl})
    }
  }

  if (loading) {
    return <div className="container mx-auto p-8">Loading...</div>
  }

  if (!brand) {
    return <div className="container mx-auto p-8">Brand not found</div>
  }

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Manage {brandName}</h1>
        <Button onClick={() => router.push(`/${brandId}`)}>View Store</Button>
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList className="mb-8">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="details">Brand Details</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="affiliates">Affiliate Program</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <h3 className="text-2xl font-bold">${totalRevenue.toFixed(2)}</h3>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <LineChart className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Sales</p>
                  <h3 className="text-2xl font-bold">{totalSales}</h3>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-purple-100 p-3 rounded-full">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Visitors</p>
                  <h3 className="text-2xl font-bold">{totalVisitors}</h3>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-amber-100 p-3 rounded-full">
                  <LineChart className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Conversion Rate</p>
                  <h3 className="text-2xl font-bold">{conversionRate}%</h3>
                </div>
              </div>
            </Card>
          </div>
          
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
            <p className="text-muted-foreground">No orders yet. When customers make purchases, they will appear here.</p>
          </Card>
          
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Top Products</h2>
            <div className="space-y-4">
              {products.slice(0, 3).map((product) => (
                <div key={product.id} className="flex items-center gap-4 border-b pb-4">
                  <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0 shadow-sm">
                    <Image 
                      src={processImageForProduct(product.image)} 
                      alt={product.name} 
                      fill 
                      className="object-cover" 
                      sizes="64px"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">${product.price.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">0 sold</p>
                    <p className="text-sm text-muted-foreground">$0.00</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Brand Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Brand Name</label>
                <Input 
                  value={brandName} 
                  onChange={(e) => setBrandName(e.target.value)} 
                  placeholder="Enter brand name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Textarea 
                  value={brandDescription} 
                  onChange={(e) => setBrandDescription(e.target.value)}
                  placeholder="Enter brand description"
                  rows={4}
                />
              </div>
              
              <ImageUpload
                imageUrl={brandImage}
                onImageChange={(url) => setBrandImage(url)}
                onFileUpload={handleBrandImageFileUpload}
                placeholderUrl="https://placehold.co/400x400.jpg"
                recommendedWidth={400}
                recommendedHeight={400}
                previewClassName="w-24 h-24"
                label="Brand Image"
              />
              
              <Button onClick={handleSaveBrandDetails}>
                <Save className="mr-2 h-4 w-4" />
                Save Brand Details
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Manage Products</h2>
            <p className="text-muted-foreground mb-4">You can add up to 8 products to your store.</p>
            
            {/* Product List */}
            <div className="space-y-4 mb-8">
              {products.map((product) => (
                <div key={product.id} className="border rounded-lg p-4">
                  {editingProduct && editingProduct.id === product.id ? (
                    <div className="space-y-3">
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <label className="block text-sm font-medium mb-1">Product Name</label>
                          <Input 
                            value={editingProduct.name} 
                            onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                          />
                        </div>
                        <div className="w-24">
                          <label className="block text-sm font-medium mb-1">Price ($)</label>
                          <Input 
                            type="number" 
                            value={editingProduct.price} 
                            onChange={(e) => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})}
                            step="0.01"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <Textarea 
                          value={editingProduct.description} 
                          onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                          rows={2}
                        />
                      </div>
                      
                      <ImageUpload
                        imageUrl={editingProduct.image}
                        onImageChange={(url) => setEditingProduct({...editingProduct, image: url})}
                        onFileUpload={(file) => handleProductImageFileUpload(file, false, editingProduct.id)}
                        placeholderUrl="https://placehold.co/600x800.jpg"
                        recommendedWidth={600}
                        recommendedHeight={800}
                        previewClassName="w-16 h-20"
                        label="Product Image"
                      />
                      
                      <div className="flex gap-2 mt-3">
                        <Button onClick={handleUpdateProduct}>
                          <Save className="mr-2 h-4 w-4" />
                          Save
                        </Button>
                        <Button variant="outline" onClick={handleCancelEdit}>
                          <X className="mr-2 h-4 w-4" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-4">
                      <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0 shadow-sm">
                        <Image 
                          src={processImageForProduct(product.image)} 
                          alt={product.name} 
                          fill 
                          className="object-cover" 
                          sizes="64px"
                          loading="lazy"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h3 className="font-semibold">{product.name}</h3>
                          <span className="font-medium">${product.price.toFixed(2)}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{product.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleEditProduct(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Add New Product */}
            {products.length < 8 && (
              <Card className="p-4 border-dashed">
                <h3 className="font-semibold mb-3">Add New Product</h3>
                <div className="space-y-3">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1">Product Name</label>
                      <Input 
                        value={newProduct.name} 
                        onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                        placeholder="Enter product name"
                      />
                    </div>
                    <div className="w-24">
                      <label className="block text-sm font-medium mb-1">Price ($)</label>
                      <Input 
                        type="number" 
                        value={newProduct.price} 
                        onChange={(e) => setNewProduct({...newProduct, price: parseFloat(e.target.value)})}
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <Textarea 
                      value={newProduct.description} 
                      onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                      placeholder="Enter product description"
                      rows={2}
                    />
                  </div>
                  
                  <ImageUpload
                    imageUrl={newProduct.image}
                    onImageChange={(url) => setNewProduct({...newProduct, image: url})}
                    onFileUpload={(file) => handleProductImageFileUpload(file, true)}
                    placeholderUrl="https://placehold.co/600x800.jpg"
                    recommendedWidth={600}
                    recommendedHeight={800}
                    previewClassName="w-16 h-20"
                    label="Product Image"
                  />
                  
                  <Button onClick={handleAddProduct} className="mt-2">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Product
                  </Button>
                </div>
              </Card>
            )}
          </Card>
        </TabsContent>
        
        <TabsContent value="affiliates" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-2">Affiliate Program</h2>
            <p className="text-muted-foreground mb-6">Manage your affiliate partners and track their performance.</p>
            
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-medium mb-1">Your Affiliate Link</h3>
                <div className="flex items-center gap-2">
                  <code className="bg-muted px-2 py-1 rounded text-sm">
                    https://perchmerch.com/{brandId}?ref=affiliate
                  </code>
                  <Button variant="outline" size="sm" onClick={handleCopyAffiliateLink}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-1">Default Commission</p>
                <p className="font-medium">10%</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-3">Affiliate Partners</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted text-left">
                      <tr>
                        <th className="p-3 font-medium">Name</th>
                        <th className="p-3 font-medium">Status</th>
                        <th className="p-3 font-medium">Commission</th>
                        <th className="p-3 font-medium">Sales</th>
                        <th className="p-3 font-medium">Revenue</th>
                        <th className="p-3 font-medium">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {affiliates.map((affiliate) => (
                        <tr key={affiliate.id}>
                          <td className="p-3">
                            <div>
                              <p className="font-medium">{affiliate.name}</p>
                              <p className="text-sm text-muted-foreground">{affiliate.email}</p>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                              affiliate.status === 'active' 
                                ? 'bg-green-100 text-green-700' 
                                : affiliate.status === 'pending' 
                                ? 'bg-amber-100 text-amber-700' 
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {affiliate.status.charAt(0).toUpperCase() + affiliate.status.slice(1)}
                            </span>
                          </td>
                          <td className="p-3">{affiliate.commission}%</td>
                          <td className="p-3">{affiliate.sales}</td>
                          <td className="p-3">${affiliate.revenue.toFixed(2)}</td>
                          <td className="p-3">{affiliate.dateJoined}</td>
                        </tr>
                      ))}
                      {affiliates.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-muted-foreground">
                            No affiliates yet. Invite partners to join your program.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <Card className="p-4 border-dashed">
                <h3 className="font-semibold mb-3">Invite New Affiliate</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Name</label>
                      <Input 
                        value={newAffiliateName} 
                        onChange={(e) => setNewAffiliateName(e.target.value)}
                        placeholder="Enter affiliate name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Email</label>
                      <Input 
                        type="email" 
                        value={newAffiliateEmail} 
                        onChange={(e) => setNewAffiliateEmail(e.target.value)}
                        placeholder="Enter email address"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Commission Rate (%)</label>
                    <Input 
                      type="number" 
                      value={newAffiliateCommission} 
                      onChange={(e) => setNewAffiliateCommission(parseInt(e.target.value))}
                      min={1}
                      max={50}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Set the commission percentage this affiliate will earn from sales.
                    </p>
                  </div>
                  
                  <Button onClick={handleAddAffiliate} className="mt-2">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite Affiliate
                  </Button>
                </div>
              </Card>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 