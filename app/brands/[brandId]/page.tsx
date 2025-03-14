"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  ShoppingBag, 
  Share2,
  Instagram,
  Twitter,
  Facebook,
  ArrowRight,
  Info,
  Check,
  Send
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { toast } from "@/components/ui/use-toast"

interface Product {
  id: string
  name: string
  description: string
  price: number
  images: string[]
  variants: {
    id: string
    name: string
    price: number
    inStock: boolean
  }[]
  category: string
}

interface Brand {
  id: string
  name: string
  description: string
  logo: string
  banner: string
  socialLinks: {
    instagram?: string
    twitter?: string
    facebook?: string
  }
  products: Product[]
  imageUrl: string
  websiteUrl: string
  twitterHandle: string
  telegramUrl: string
  customLinks: { title: string; url: string }[]
  colors: string[]
}

interface CartItem {
  productId: string
  brandId: string
  quantity: number
}

export default function BrandStorePage({ params }: { params: { brandId: string } }) {
  const [brand, setBrand] = useState<Brand | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    // Initialize cart from localStorage if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cart')
      return saved ? JSON.parse(saved) : []
    }
    return []
  })
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const fetchBrand = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/brands/${params.brandId}`)
        if (!response.ok) throw new Error('Failed to fetch brand')
        const data = await response.json()
        setBrand(data)
      } catch (err) {
        setError('Could not load brand store')
        console.error('Error fetching brand:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBrand()
  }, [params.brandId])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cart', JSON.stringify(cartItems))
    }
  }, [cartItems])

  useEffect(() => {
    // Check authentication state
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check')
        if (response.ok) {
          setIsAuthenticated(true)
        }
      } catch (err) {
        console.error('Error checking authentication:', err)
      }
    }

    checkAuth()
  }, [])

  const addToCart = (product: Product) => {
    setCartItems(prev => {
      const existingItem = prev.find(
        item => item.productId === product.id && item.brandId === params.brandId
      )

      if (existingItem) {
        // Update quantity if item exists
        return prev.map(item =>
          item.productId === product.id && item.brandId === params.brandId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      } else {
        // Add new item
        return [...prev, { productId: product.id, brandId: params.brandId, quantity: 1 }]
      }
    })

    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
      action: (
        <Button asChild variant="outline" size="sm">
          <Link href="/cart">
            View Cart
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      )
    })
  }

  const getItemQuantity = (productId: string) => {
    const item = cartItems.find(
      item => item.productId === productId && item.brandId === params.brandId
    )
    return item?.quantity || 0
  }

  const handleShare = async () => {
    try {
      await navigator.share({
        title: brand?.name,
        text: brand?.description,
        url: window.location.href
      })
    } catch (err) {
      // Fallback to copying link
      navigator.clipboard.writeText(window.location.href)
      toast({
        title: "Link copied!",
        description: "Share this brand store with your friends"
      })
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Skeleton className="h-[300px] w-full rounded-xl mb-8" />
        <Skeleton className="h-20 w-48 rounded-full mx-auto -mt-10 relative z-10" />
        <div className="space-y-4 mt-8">
          <Skeleton className="h-8 w-64 mx-auto" />
          <Skeleton className="h-4 w-96 mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          {[1,2,3,4].map(i => (
            <Skeleton key={i} className="h-[400px] rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !brand) {
    return (
      <div className="container mx-auto py-16 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Store Not Found</h1>
        <p className="text-muted-foreground mb-8">{error || "This brand store doesn't exist"}</p>
        <Button asChild>
          <Link href="/brands">Browse Other Brands</Link>
        </Button>
      </div>
    )
  }

  const totalItemsInCart = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-8">
        <Link href="/" className="text-sm">
          PerchMerch Home
        </Link>
        <div className="flex gap-4">
          {isAuthenticated ? (
            <>
              <Link href="/dashboard" className="text-sm">
                Dashboard
              </Link>
              <Link href="/cart" className="text-sm">
                Bag
              </Link>
              <Link href="/api/auth/signout" className="text-sm">
                Sign Out
              </Link>
            </>
          ) : (
            <div className="fixed top-0 right-0 p-4">
              <Link href="/signin" className="text-sm">
                Sign In | Sign Up  
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Hero Section with Banner */}
      <div className="relative h-[300px] w-full">
        <Image
          src={brand.banner}
          alt={`${brand.name} banner`}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
      </div>

      {/* Brand Logo and Info */}
      <div className="container mx-auto px-4 -mt-16 relative z-10">
        <div className="flex flex-col items-center text-center mb-12">
          <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-background shadow-lg mb-4">
            <Image
              src={brand.logo}
              alt={brand.name}
              width={128}
              height={128}
              className="object-cover"
            />
          </div>
          
          <h1 className="text-3xl font-bold mb-2">{brand.name}</h1>
          <p className="text-muted-foreground max-w-2xl mb-4">{brand.description}</p>
          
          <div className="flex items-center gap-4">
            {brand.socialLinks.instagram && (
              <a 
                href={brand.socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
            )}
            {brand.socialLinks.twitter && (
              <a 
                href={brand.socialLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
            )}
            {brand.socialLinks.facebook && (
              <a 
                href={brand.socialLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Brand Links */}
        <div className="flex gap-4 mb-8">
          {brand.websiteUrl && (
            <Button asChild>
              <Link href={brand.websiteUrl}>Website</Link>
            </Button>
          )}
          {brand.twitterHandle && (
            <Button asChild variant="outline">
              <Link href={`https://twitter.com/${brand.twitterHandle}`}>
                <Twitter className="mr-2 h-4 w-4" />
                {brand.twitterHandle}
              </Link>
            </Button>
          )}
          {brand.telegramUrl && (
            <Button asChild variant="outline">
              <Link href={brand.telegramUrl}>
                <Send className="mr-2 h-4 w-4" />
                Telegram
              </Link>
            </Button>
          )}
          {brand.customLinks.map(link => (
            <Button key={link.url} asChild variant="outline">
              <Link href={link.url}>{link.title}</Link>
            </Button>
          ))}
        </div>

        {/* Cart Summary */}
        {totalItemsInCart > 0 && (
          <div className="fixed bottom-4 right-4 z-50">
            <Button asChild className="shadow-lg">
              <Link href="/cart">
                <ShoppingBag className="mr-2 h-4 w-4" />
                View Cart ({totalItemsInCart})
              </Link>
            </Button>
          </div>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {brand.products.map((product) => {
            const quantity = getItemQuantity(product.id)
            
            return (
              <Card key={product.id} className="group relative overflow-hidden">
                <div className="aspect-square relative overflow-hidden">
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button 
                      variant="secondary"
                      className="transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all"
                      onClick={() => addToCart(product)}
                    >
                      {quantity > 0 ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Add Another
                        </>
                      ) : (
                        <>
                          Add to Cart
                          <ShoppingBag className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold truncate">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">${product.price.toFixed(2)}</p>
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-[200px] text-sm">{product.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">
                      {product.category}
                    </Badge>
                    {quantity > 0 && (
                      <Badge variant="secondary">
                        {quantity} in cart
                      </Badge>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      <style jsx>{`
        :root {
          --brand-color-1: ${brand.colors[0]};
          --brand-color-2: ${brand.colors[1]};
          --brand-color-3: ${brand.colors[2]};
        }
      `}</style>
    </div>
  )
} 