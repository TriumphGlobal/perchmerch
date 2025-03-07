"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { formatCurrency, processImageForBrand, processImageForProduct } from "@/lib/utils"
import { Store } from "lucide-react"

interface Product {
  id: string
  name: string
  description: string
  price: number
  image: string
}

// Default products as fallback
const defaultProducts: Product[] = [
  {
    id: "1",
    name: "Classic T-Shirt",
    description: "Premium cotton t-shirt with custom design",
    price: 24.99,
    image: "https://placehold.co/300x400.jpg",
  },
  {
    id: "2",
    name: "Hoodie",
    description: "Comfortable hoodie perfect for any weather",
    price: 49.99,
    image: "https://placehold.co/300x400.jpg",
  },
  {
    id: "3",
    name: "Baseball Cap",
    description: "Stylish cap with embroidered logo",
    price: 19.99,
    image: "https://placehold.co/300x400.jpg",
  },
  {
    id: "4",
    name: "Phone Case",
    description: "Durable phone case with unique artwork",
    price: 14.99,
    image: "https://placehold.co/300x400.jpg",
  },
  {
    id: "5",
    name: "Tote Bag",
    description: "Eco-friendly canvas tote with printed design",
    price: 18.99,
    image: "https://placehold.co/300x400.jpg",
  },
  {
    id: "6",
    name: "Sticker Pack",
    description: "Set of 5 waterproof vinyl stickers",
    price: 9.99,
    image: "https://placehold.co/300x400.jpg",
  },
  {
    id: "7",
    name: "Coffee Mug",
    description: "Ceramic mug with wraparound print",
    price: 16.99,
    image: "https://placehold.co/300x400.jpg",
  },
  {
    id: "8",
    name: "Poster",
    description: "High-quality 18x24 inch poster print",
    price: 22.99,
    image: "https://placehold.co/300x400.jpg",
  },
]

export default function DemoBrandPage() {
  const { user, canManageBrand, getAllBrands } = useAuth()
  const router = useRouter()
  const canManage = canManageBrand("demo")
  const [products, setProducts] = useState<Product[]>(defaultProducts)
  const [loading, setLoading] = useState(true)
  const [brand, setBrand] = useState<any>(null)
  
  useEffect(() => {
    // Load brand data from auth context
    const allBrands = getAllBrands()
    const demoBrand = allBrands.find(b => b.slug === "demo")
    
    if (demoBrand) {
      setBrand(demoBrand)
      // Use brand products if they exist, otherwise use default products
      if (demoBrand.products && demoBrand.products.length > 0) {
        setProducts(demoBrand.products)
      }
    }
    
    setLoading(false)
  }, [getAllBrands])

  const handleManageStore = () => {
    router.push("/demo/manage")
  }

  if (loading) {
    return <div className="container mx-auto p-8">Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-6">
          {brand?.mainImage ? (
            <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-lg overflow-hidden shadow-md">
              <Image
                src={processImageForBrand(brand.mainImage)}
                alt={brand.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 128px, 160px"
                priority
              />
            </div>
          ) : (
            <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-lg overflow-hidden shadow-md bg-muted flex items-center justify-center">
              <Store className="h-16 w-16 text-muted-foreground/40" />
            </div>
          )}
          <div>
            <h1 className="text-4xl font-bold mb-2">Demo Brand</h1>
            <p className="text-muted-foreground">
              Check out our collection of custom merchandise
            </p>
          </div>
        </div>
        {canManage && (
          <Button onClick={handleManageStore} className="bg-blue-600 hover:bg-blue-700">
            Manage Store
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <div
            key={product.id}
            className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="relative aspect-square">
              <Image
                src={processImageForProduct(product.image)}
                alt={product.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="font-semibold mb-1">{product.name}</h3>
              <p className="text-sm text-muted-foreground mb-2">
                {product.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {formatCurrency(product.price)}
                </span>
                <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 