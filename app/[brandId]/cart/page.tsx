"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { 
  Loader2,
  Trash2,
  ShoppingBag,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { processImageForProduct } from "@/lib/utils"

interface CartItem {
  productId: string;
  variantId: string;
  quantity: number;
  title: string;
  price: number;
  image: string;
}

export default function CartPage({ params }: { params: { brandId: string } }) {
  const router = useRouter()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadCart()
  }, [])

  const loadCart = async () => {
    try {
      const response = await fetch(`/api/brands/${params.brandId}/cart`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to load cart")
      }

      setCartItems(data)
    } catch (error) {
      console.error("Error loading cart:", error)
      toast({
        title: "Error",
        description: "Failed to load cart items",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateQuantity = async (productId: string, variantId: string, newQuantity: number) => {
    if (newQuantity < 1) return

    try {
      const response = await fetch(`/api/brands/${params.brandId}/cart`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          productId,
          variantId,
          quantity: newQuantity
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update cart")
      }

      setCartItems(data)
    } catch (error) {
      console.error("Error updating cart:", error)
      toast({
        title: "Error",
        description: "Failed to update cart item",
        variant: "destructive"
      })
    }
  }

  const handleRemoveItem = async (productId: string, variantId: string) => {
    try {
      const response = await fetch(`/api/brands/${params.brandId}/cart`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          productId,
          variantId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to remove item")
      }

      setCartItems(data)
    } catch (error) {
      console.error("Error removing item:", error)
      toast({
        title: "Error",
        description: "Failed to remove item from cart",
        variant: "destructive"
      })
    }
  }

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <ShoppingBag className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Your cart is empty</h2>
        <p className="text-muted-foreground">
          Add some items to your cart to get started
        </p>
        <Button onClick={() => router.back()}>
          Continue Shopping
        </Button>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-8 space-y-8">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Continue Shopping
        </Button>
        <Button
          onClick={() => router.push(`/brands/${params.brandId}/checkout`)}
          className="flex items-center gap-2"
        >
          Proceed to Checkout
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          {cartItems.map((item) => (
            <div key={`${item.productId}-${item.variantId}`} className="flex gap-4">
              <div className="relative h-24 w-24 flex-shrink-0">
                <Image
                  src={processImageForProduct(item.image)}
                  alt={item.title}
                  fill
                  className="object-cover rounded-md"
                />
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="font-medium">{item.title}</h3>
                <p className="text-sm text-muted-foreground">
                  ${item.price.toFixed(2)}
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleUpdateQuantity(item.productId, item.variantId, item.quantity - 1)}
                    >
                      -
                    </Button>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleUpdateQuantity(item.productId, item.variantId, parseInt(e.target.value))}
                      className="w-16 h-8 text-center"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleUpdateQuantity(item.productId, item.variantId, item.quantity + 1)}
                    >
                      +
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => handleRemoveItem(item.productId, item.variantId)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            </div>
          ))}

          <Separator />

          <div className="flex justify-between items-center">
            <p className="font-medium">Total</p>
            <p className="text-xl font-bold">
              ${calculateTotal().toFixed(2)}
            </p>
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={() => router.push(`/brands/${params.brandId}/checkout`)}
          >
            Proceed to Checkout
          </Button>
        </CardContent>
      </Card>
    </div>
  )
} 