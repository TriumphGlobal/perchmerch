/// <reference types="react" />
/// <reference types="next" />

"use client"

import * as React from "react"
import Image from "next/image"
import { Check, Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"

interface Product {
  id: string
  name: string
  image: string
  category: string
  basePrice: number
  printifyUrl?: string
  historicalVolume?: number
}

interface SelectedProduct extends Product {
  profitMargin: number
  dailySales: number
  customTitle: string
  customPitch: string
  mainImage: string
  productImage: string
  printifyUrl: string
}

interface ProductSelectorProps {
  selectedProducts: SelectedProduct[]
  setSelectedProducts: (products: SelectedProduct[]) => void
  maxProducts: number
}

export function ProductSelector({ selectedProducts, setSelectedProducts, maxProducts }: ProductSelectorProps) {
  const [filter, setFilter] = React.useState<string>("all")
  const [printifyUrl, setPrintifyUrl] = React.useState<string>("")
  const [isLoadingProduct, setIsLoadingProduct] = React.useState(false)

  // This would be fetched from your Printify integration in a real application
  const products: Product[] = [
    {
      id: "p1",
      name: "Classic T-Shirt",
      image: "/placeholder.svg?height=200&width=200",
      category: "apparel",
      basePrice: 15,
    },
    {
      id: "p2",
      name: "Premium Hoodie",
      image: "/placeholder.svg?height=200&width=200",
      category: "apparel",
      basePrice: 30,
    },
    {
      id: "p3",
      name: "Canvas Tote Bag",
      image: "/placeholder.svg?height=200&width=200",
      category: "accessories",
      basePrice: 10,
    },
    {
      id: "p4",
      name: "Coffee Mug",
      image: "/placeholder.svg?height=200&width=200",
      category: "homeware",
      basePrice: 8,
    },
    {
      id: "p5",
      name: "Phone Case",
      image: "/placeholder.svg?height=200&width=200",
      category: "accessories",
      basePrice: 12,
    },
    {
      id: "p6",
      name: "Baseball Cap",
      image: "/placeholder.svg?height=200&width=200",
      category: "apparel",
      basePrice: 10,
    },
    {
      id: "p7",
      name: "Sticker Pack",
      image: "/placeholder.svg?height=200&width=200",
      category: "stationery",
      basePrice: 5,
    },
    {
      id: "p8",
      name: "Poster Print",
      image: "/placeholder.svg?height=200&width=200",
      category: "homeware",
      basePrice: 8,
    },
    {
      id: "p9",
      name: "Notebook",
      image: "/placeholder.svg?height=200&width=200",
      category: "stationery",
      basePrice: 7,
    },
    {
      id: "p10",
      name: "Water Bottle",
      image: "/placeholder.svg?height=200&width=200",
      category: "accessories",
      basePrice: 12,
    },
    { id: "p11", name: "Beanie", image: "/placeholder.svg?height=200&width=200", category: "apparel", basePrice: 12 },
    {
      id: "p12",
      name: "Throw Pillow",
      image: "/placeholder.svg?height=200&width=200",
      category: "homeware",
      basePrice: 15,
    },
  ]

  const filteredProducts = filter === "all" ? products : products.filter((product) => product.category === filter)

  const toggleProduct = (product: Product) => {
    const index = selectedProducts.findIndex((p) => p.id === product.id)
    if (index !== -1) {
      setSelectedProducts(selectedProducts.filter((p) => p.id !== product.id))
    } else {
      if (selectedProducts.length < maxProducts) {
        setSelectedProducts([
          ...selectedProducts,
          {
            ...product,
            profitMargin: 50,
            dailySales: 0,
            customTitle: product.name,
            customPitch: "",
            mainImage: product.image,
            productImage: product.image,
            printifyUrl: "",
          },
        ])
      }
    }
  }

  const addPrintifyProduct = async (url: string) => {
    setIsLoadingProduct(true)
    try {
      // In a real application, this would make an API call to fetch product details from Printify
      // For now, we'll simulate it with a timeout
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock product data - in reality, this would come from the Printify API
      const mockProduct: Product = {
        id: `printify-${Date.now()}`,
        name: "Custom Printify Product",
        image: "/placeholder.svg?height=200&width=200",
        category: "custom",
        basePrice: 20,
        printifyUrl: url,
        historicalVolume: Math.floor(Math.random() * 100) // Mock historical volume
      }

      if (selectedProducts.length < maxProducts) {
        setSelectedProducts([
          ...selectedProducts,
          {
            ...mockProduct,
            profitMargin: 50,
            dailySales: 0,
            customTitle: mockProduct.name,
            customPitch: "",
            mainImage: mockProduct.image,
            productImage: mockProduct.image,
            printifyUrl: url
          },
        ])
      }
      setPrintifyUrl("")
    } catch (error) {
      toast({
        title: "Error adding product",
        description: "Failed to fetch product details from Printify. Please check the URL and try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingProduct(false)
    }
  }

  const validateProfitRequirements = (product: SelectedProduct) => {
    const dailyRevenue = product.basePrice * (1 + product.profitMargin / 100) * product.dailySales
    const dailyProfit = (product.basePrice * (product.profitMargin / 100)) * product.dailySales
    
    // Check if historical volume suggests viability
    const historicalDailyProfit = product.historicalVolume 
      ? (product.basePrice * (product.profitMargin / 100)) * product.historicalVolume
      : 0

    if (dailyProfit >= 100 || product.profitMargin >= 30 || historicalDailyProfit >= 100) {
      return true
    }

    return false
  }

  const updateProduct = (productId: string, updates: Partial<SelectedProduct>) => {
    setSelectedProducts(
      selectedProducts.map(p => {
        if (p.id === productId) {
          const updatedProduct = { ...p, ...updates }
          // Validate profit requirements
          if ('profitMargin' in updates || 'dailySales' in updates) {
            if (!validateProfitRequirements(updatedProduct)) {
              toast({
                title: "Invalid profit settings",
                description: "Product must have either 30% profit margin or generate $100/day based on sales volume.",
                variant: "destructive",
              })
              return p
            }
          }
          return updatedProduct
        }
        return p
      })
    )
  }

  const calculateAllowedProfitMargin = React.useCallback((product: SelectedProduct) => {
    return (requestedMargin: number) => {
      const dailyProfit = product.basePrice * (requestedMargin / 100) * product.dailySales
      if (dailyProfit >= 100 || requestedMargin >= 30) {
        return requestedMargin
      } else {
        return Math.max(30, (100 / (product.basePrice * product.dailySales)) * 100)
      }
    }
  }, [])

  React.useEffect(() => {
    // Recalculate profit margins when daily sales change
    setSelectedProducts(
      selectedProducts.map((product) => ({
        ...product,
        profitMargin: calculateAllowedProfitMargin(product)(product.profitMargin),
      })),
    )
  }, [selectedProducts, setSelectedProducts, calculateAllowedProfitMargin])

  const handleImageUpload = async (productId: string, imageType: "main" | "product", file: File) => {
    // Check image dimensions
    const img = new Image()
    img.src = URL.createObjectURL(file)
    await new Promise((resolve) => {
      img.onload = resolve
    })

    const minWidth = imageType === "main" ? 1200 : 1000
    const minHeight = imageType === "main" ? 800 : 1000

    if (img.width < minWidth || img.height < minHeight) {
      toast({
        title: "Image too small",
        description: `${imageType === "main" ? "Main" : "Product"} image should be at least ${minWidth}x${minHeight} pixels.`,
        variant: "destructive",
      })
      return
    }

    // In a real application, you would upload the file to your server or a service like AWS S3 here
    // For this example, we'll just use a local URL
    const imageUrl = URL.createObjectURL(file)
    updateProduct(productId, { [imageType === "main" ? "mainImage" : "productImage"]: imageUrl })
  }

  const handlePrintifyUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrintifyUrl(e.target.value)
  }

  const handleProductUrlChange = (productId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    updateProduct(productId, { printifyUrl: e.target.value })
  }

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <Label htmlFor="printifyUrl">Add Product from Printify</Label>
        <div className="flex gap-2">
          <Input
            id="printifyUrl"
            placeholder="Enter Printify product URL"
            value={printifyUrl}
            onChange={handlePrintifyUrlChange}
          />
          <Button 
            onClick={() => addPrintifyProduct(printifyUrl)}
            disabled={isLoadingProduct || !printifyUrl || selectedProducts.length >= maxProducts}
          >
            {isLoadingProduct ? "Adding..." : "Add Product"}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "px-3 py-1 text-sm rounded-full",
            filter === "all"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80",
          )}
        >
          All
        </button>
        <button
          onClick={() => setFilter("apparel")}
          className={cn(
            "px-3 py-1 text-sm rounded-full",
            filter === "apparel"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80",
          )}
        >
          Apparel
        </button>
        <button
          onClick={() => setFilter("accessories")}
          className={cn(
            "px-3 py-1 text-sm rounded-full",
            filter === "accessories"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80",
          )}
        >
          Accessories
        </button>
        <button
          onClick={() => setFilter("homeware")}
          className={cn(
            "px-3 py-1 text-sm rounded-full",
            filter === "homeware"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80",
          )}
        >
          Homeware
        </button>
        <button
          onClick={() => setFilter("stationery")}
          className={cn(
            "px-3 py-1 text-sm rounded-full",
            filter === "stationery"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80",
          )}
        >
          Stationery
        </button>
      </div>

      <p className="text-sm text-muted-foreground">
        Selected {selectedProducts.length} of {maxProducts} products
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {filteredProducts.map((product) => {
          const isSelected = selectedProducts.some((p) => p.id === product.id)
          const selectedProduct = selectedProducts.find((p) => p.id === product.id)
          return (
            <div
              key={product.id}
              className={cn(
                "border rounded-lg overflow-hidden transition-all",
                isSelected ? "ring-2 ring-primary" : "hover:border-primary/50",
                selectedProducts.length >= maxProducts && !isSelected
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer"
              )}
              onClick={() => toggleProduct(product)}
            >
              <div className="relative aspect-square">
                <Image 
                  src={product.image || "/placeholder.svg"} 
                  alt={product.name} 
                  fill 
                  className="object-cover" 
                />
                {isSelected && (
                  <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                    <Check className="h-4 w-4" />
                  </div>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-medium text-sm">{product.name}</h3>
                <p className="text-xs text-muted-foreground capitalize">{product.category}</p>
                <p className="text-xs text-muted-foreground">Base Price: ${product.basePrice.toFixed(2)}</p>
                {product.historicalVolume && (
                  <p className="text-xs text-muted-foreground">
                    Historical Daily Volume: {product.historicalVolume}
                  </p>
                )}
                {isSelected && (
                  <div className="mt-2 space-y-2">
                    <div>
                      <Label htmlFor={`printifyUrl-${product.id}`} className="text-xs">
                        Printify URL
                      </Label>
                      <Input
                        id={`printifyUrl-${product.id}`}
                        value={selectedProduct?.printifyUrl}
                        onChange={(e) => handleProductUrlChange(product.id, e)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`customTitle-${product.id}`} className="text-xs">
                        Custom Title
                      </Label>
                      <Input
                        id={`customTitle-${product.id}`}
                        value={selectedProduct?.customTitle}
                        onChange={(e) => updateProduct(product.id, { customTitle: e.target.value })}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`customPitch-${product.id}`} className="text-xs">
                        Custom Pitch
                      </Label>
                      <Textarea
                        id={`customPitch-${product.id}`}
                        value={selectedProduct?.customPitch}
                        onChange={(e) => updateProduct(product.id, { customPitch: e.target.value })}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 text-xs"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`profit-${product.id}`} className="text-xs">
                        Profit Margin (%)
                      </Label>
                      <Input
                        id={`profit-${product.id}`}
                        type="number"
                        min="0"
                        max="1000"
                        value={selectedProduct?.profitMargin}
                        onChange={(e) => updateProduct(product.id, { profitMargin: Number(e.target.value) })}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`sales-${product.id}`} className="text-xs">
                        Daily Sales
                      </Label>
                      <Input
                        id={`sales-${product.id}`}
                        type="number"
                        min="0"
                        value={selectedProduct?.dailySales}
                        onChange={(e) => updateProduct(product.id, { dailySales: Number(e.target.value) })}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Main Image (min 1200x800)</Label>
                      <div className="flex items-center mt-1">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => e.target.files && handleImageUpload(product.id, "main", e.target.files[0])}
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="ml-2"
                          onClick={(e) => {
                            e.stopPropagation()
                            document.getElementById(`mainImage-${product.id}`)?.click()
                          }}
                        >
                          <Upload className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Product Image (min 1000x1000)</Label>
                      <div className="flex items-center mt-1">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            e.target.files && handleImageUpload(product.id, "product", e.target.files[0])
                          }
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="ml-2"
                          onClick={(e) => {
                            e.stopPropagation()
                            document.getElementById(`productImage-${product.id}`)?.click()
                          }}
                        >
                          <Upload className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

