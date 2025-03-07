"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { formatCurrency, processImageForBrand, processImageForProduct } from "@/lib/utils"
import { notFound } from "next/navigation"
import { ProductReview, Review } from "@/components/product-review"
import { Users, Store } from "lucide-react"

interface Product {
  id: string
  name: string
  description: string
  price: number
  image: string
  reviews?: Review[]
}

// Default products if none are defined
const defaultProducts: Product[] = [
  {
    id: "1",
    name: "Classic T-Shirt",
    description: "Premium cotton t-shirt with custom design",
    price: 24.99,
    image: "https://placehold.co/300x400.jpg",
    reviews: [
      {
        id: "r1",
        productId: "1",
        userId: "user1",
        username: "JohnDoe",
        rating: 5,
        comment: "Great quality t-shirt, fits perfectly!",
        createdAt: "2023-05-15T10:30:00Z"
      },
      {
        id: "r2",
        productId: "1",
        userId: "user2",
        username: "SarahSmith",
        rating: 4,
        comment: "Nice material, but runs a bit small.",
        createdAt: "2023-06-20T14:15:00Z"
      }
    ]
  },
  {
    id: "2",
    name: "Hoodie",
    description: "Comfortable hoodie perfect for any weather",
    price: 49.99,
    image: "https://placehold.co/300x400.jpg",
    reviews: [
      {
        id: "r3",
        productId: "2",
        userId: "user3",
        username: "MikeJones",
        rating: 5,
        comment: "Super warm and comfortable. Love it!",
        createdAt: "2023-04-10T09:45:00Z"
      }
    ]
  },
  {
    id: "3",
    name: "Baseball Cap",
    description: "Stylish cap with embroidered logo",
    price: 19.99,
    image: "https://placehold.co/300x400.jpg",
    reviews: []
  },
  {
    id: "4",
    name: "Phone Case",
    description: "Durable phone case with unique artwork",
    price: 14.99,
    image: "https://placehold.co/300x400.jpg",
    reviews: [
      {
        id: "r4",
        productId: "4",
        userId: "user4",
        username: "EmilyWilson",
        rating: 3,
        comment: "Decent case, but the print started fading after a month.",
        createdAt: "2023-07-05T16:20:00Z"
      }
    ]
  },
]

export default function BrandPage({ params }: { params: { brandSlug: string } }) {
  const { brandSlug } = params
  const { canManageBrand, getAllBrands } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [brand, setBrand] = useState<any>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null)
  
  useEffect(() => {
    // Load brand data
    const allBrands = getAllBrands()
    const currentBrand = allBrands.find(b => b.slug === brandSlug)
    
    if (currentBrand) {
      setBrand(currentBrand)
      
      // Use brand products if they exist, otherwise use default products
      if (currentBrand.products && currentBrand.products.length > 0) {
        setProducts(currentBrand.products)
      } else {
        setProducts(defaultProducts)
      }
    }
    
    setLoading(false)
  }, [brandSlug, getAllBrands])

  const handleManageStore = () => {
    router.push(`/${brandSlug}/manage`)
  }

  const toggleProductExpand = (productId: string) => {
    if (expandedProduct === productId) {
      setExpandedProduct(null)
    } else {
      setExpandedProduct(productId)
    }
  }

  // If brand not found after loading, show 404
  if (!loading && !brand) {
    notFound()
  }

  if (loading) {
    return <div className="container mx-auto p-8">Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-6">
          {brand.mainImage ? (
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
            <h1 className="text-4xl font-bold mb-2">{brand.name}</h1>
            {brand.description && (
              <p className="text-muted-foreground max-w-2xl">
                {brand.description}
              </p>
            )}
          </div>
        </div>
        
        {canManageBrand(brandSlug) && (
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
            <div className="relative aspect-square bg-gray-50">
              <Image
                src={processImageForProduct(product.image)}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                loading="lazy"
              />
            </div>
            <div className="p-4">
              <h3 className="font-semibold mb-1">{product.name}</h3>
              <p className="text-sm text-muted-foreground mb-2">
                {product.description}
              </p>
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium">
                  {formatCurrency(product.price)}
                </span>
                <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
                  Add to Cart
                </button>
              </div>
              
              <Button 
                variant="ghost" 
                className="w-full text-sm" 
                onClick={() => toggleProductExpand(product.id)}
              >
                {expandedProduct === product.id ? "Hide Reviews" : "Show Reviews"}
              </Button>
              
              {expandedProduct === product.id && (
                <ProductReview 
                  productId={product.id} 
                  initialReviews={product.reviews || []} 
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 