"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { ImageUpload } from "@/components/image-upload"
import { 
  Search, 
  Plus, 
  Check, 
  X, 
  AlertCircle, 
  DollarSign,
  Percent,
  Save,
  ArrowLeft,
  ArrowRight,
  Loader2
} from "lucide-react"
import { printifyApi, PrintifyProduct } from "@/lib/api/printify"
import { processImageForProduct } from "@/lib/utils"

interface ProductFormData {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  printifyProductId: string;
  printProviderId: string;
  variants: Array<{
    id: string;
    title: string;
    price: number;
    sku: string;
  }>;
  printAreas: Array<{
    position: string;
    height: number;
    width: number;
  }>;
}

export default function AddProductsPage({ params }: { params: { brandSlug: string } }) {
  const { brandSlug } = params
  const { user, canManageBrand, getAllBrands, updateBrandProducts } = useAuth()
  const router = useRouter()
  
  const [brand, setBrand] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [printifyUrl, setPrintifyUrl] = useState("")
  const [isLoadingProduct, setIsLoadingProduct] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<ProductFormData[]>([])
  const [currentProduct, setCurrentProduct] = useState<ProductFormData | null>(null)
  
  // Check if user can manage this brand
  useEffect(() => {
    if (!canManageBrand(brandSlug)) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to manage this brand",
        variant: "destructive"
      })
      router.push(`/${brandSlug}`)
      return
    }

    // Load brand data
    const allBrands = getAllBrands()
    const currentBrand = allBrands.find(b => b.slug === brandSlug)
    
    if (currentBrand) {
      setBrand(currentBrand)
      
      // If brand already has products, initialize them
      if (currentBrand.products && currentBrand.products.length > 0) {
        setSelectedProducts(currentBrand.products)
      }
    }
    
    setLoading(false)
  }, [brandSlug, canManageBrand, getAllBrands, router])

  const extractPrintifyId = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const productId = pathParts[pathParts.length - 1];
      return productId;
    } catch (error) {
      return null;
    }
  }
  
  const handleAddPrintifyProduct = async () => {
    const productId = extractPrintifyId(printifyUrl);
    if (!productId) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid Printify product URL",
        variant: "destructive"
      });
      return;
    }

    setIsLoadingProduct(true);
    try {
      const product = await printifyApi.getProduct(productId);
      
      // Create product form data
      const newProduct: ProductFormData = {
        id: crypto.randomUUID(),
        name: product.title,
        description: product.description,
        price: product.variants[0]?.price || 0,
        image: product.images[0] || "",
        printifyProductId: product.id,
        printProviderId: product.print_provider_id,
        variants: product.variants,
        printAreas: product.print_areas
      };
      
      setSelectedProducts(prev => [...prev, newProduct]);
      setPrintifyUrl("");
      
      toast({
        title: "Product Added",
        description: "The product has been added to your selection"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch product",
        variant: "destructive"
      });
    } finally {
      setIsLoadingProduct(false);
    }
  }
  
  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts(prev => prev.filter(p => p.id !== productId));
  }
  
  const handleUpdateProduct = (productId: string, updates: Partial<ProductFormData>) => {
    setSelectedProducts(prev => 
      prev.map(p => p.id === productId ? { ...p, ...updates } : p)
    );
  }
  
  const handleSaveProducts = async () => {
    if (!brand) return;
    
    try {
      // Update brand products
      await updateBrandProducts(brand.id, selectedProducts);
      
      toast({
        title: "Products Saved",
        description: "Your products have been saved successfully"
      });
      
      // Redirect to brand management page
      router.push(`/${brandSlug}/manage`);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save products",
        variant: "destructive"
      });
    }
  }
  
  if (loading) {
    return <div className="container mx-auto p-8">Loading...</div>;
  }
  
  if (!brand) {
    return <div className="container mx-auto p-8">Brand not found</div>;
  }
  
  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Add Products to {brand.name}</h1>
        <Button onClick={() => router.push(`/${brandSlug}/manage`)}>
          Cancel
        </Button>
      </div>
      
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <Label>Printify Product URL</Label>
              <div className="flex gap-2">
                <Input
                  value={printifyUrl}
                  onChange={(e) => setPrintifyUrl(e.target.value)}
                  placeholder="Enter Printify product URL"
                  disabled={isLoadingProduct}
                />
                <Button 
                  onClick={handleAddPrintifyProduct}
                  disabled={!printifyUrl || isLoadingProduct}
                >
                  {isLoadingProduct ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Add Product
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Paste the URL of a Printify product you want to add to your store
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {selectedProducts.length > 0 ? (
        <div className="space-y-6">
          {selectedProducts.map((product) => (
            <Card key={product.id}>
              <CardContent className="p-6">
                <div className="flex gap-6">
                  <div className="relative w-32 h-32">
                    <Image
                      src={processImageForProduct(product.image)}
                      alt={product.name}
                      fill
                      className="object-cover rounded-md"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-medium text-lg">{product.name}</h3>
                        <p className="text-sm text-muted-foreground">{product.description}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveProduct(product.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div>
                        <Label>Price</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            value={product.price}
                            onChange={(e) => handleUpdateProduct(product.id, { price: parseFloat(e.target.value) })}
                            className="pl-10"
                            step="0.01"
                            min="0"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label>Variants</Label>
                        <p className="text-sm text-muted-foreground">
                          {product.variants.length} available
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          <div className="flex justify-end">
            <Button onClick={handleSaveProducts}>
              <Save className="mr-2 h-4 w-4" />
              Save Products
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          No products added yet. Add products using the form above.
        </div>
      )}
    </div>
  )
} 