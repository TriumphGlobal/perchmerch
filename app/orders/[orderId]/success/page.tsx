"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Gift, ShoppingBag, ArrowRight } from "lucide-react"

interface OrderDetails {
  id: string
  status: string
  totalAmount: number
  createdAt: string
  printifyOrderId: string
  isGift: boolean
  giftMessage?: string
  shippingAddress: {
    firstName: string
    lastName: string
    email: string
    phone: string
    address1: string
    address2?: string
    city: string
    state: string
    zip: string
    country: string
  }
  items: {
    quantity: number
    product: {
      id: string
      name: string
      description: string
      price: number
      images: string[]
    }
  }[]
}

export default function OrderSuccessPage({ params }: { params: { orderId: string } }) {
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/orders/${params.orderId}`)
        if (!response.ok) throw new Error('Failed to fetch order')
        const data = await response.json()
        setOrder(data)
      } catch (err) {
        setError('Could not load order details')
        console.error('Error fetching order:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrder()
  }, [params.orderId])

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-[200px] mb-8" />
        <div className="grid gap-8">
          <Skeleton className="h-[100px]" />
          <Skeleton className="h-[100px]" />
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="container mx-auto py-16 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
        <p className="text-muted-foreground mb-8">{error || "This order doesn't exist"}</p>
        <Button asChild>
          <Link href="/">Return Home</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-4">Thank You for Your Order!</h1>
          <p className="text-muted-foreground mb-2">
            Order #{order.id}
          </p>
          <p className="text-sm text-muted-foreground">
            We'll send updates about your order to {order.shippingAddress.email}
          </p>
        </div>

        {order.isGift && (
          <Card className="p-6 mb-8 bg-primary/5">
            <div className="flex items-start gap-4">
              <Gift className="h-5 w-5 text-primary mt-1" />
              <div>
                <h3 className="font-semibold mb-2">This is a Gift Order</h3>
                {order.giftMessage && (
                  <div className="bg-background p-4 rounded-lg">
                    <p className="text-sm italic">"{order.giftMessage}"</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        <Card className="mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.product.id} className="flex items-center gap-4">
                  <div className="relative h-20 w-20">
                    <Image
                      src={item.product.images[0]}
                      alt={item.product.name}
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{item.product.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Quantity: {item.quantity}
                    </p>
                  </div>
                  <p className="font-medium">
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t p-6">
            <div className="flex justify-between mb-2">
              <span className="text-muted-foreground">Total</span>
              <span className="font-semibold">${order.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </Card>

        <Card className="mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>
            <p className="text-muted-foreground">
              {order.shippingAddress.firstName} {order.shippingAddress.lastName}<br />
              {order.shippingAddress.address1}<br />
              {order.shippingAddress.address2 && <>{order.shippingAddress.address2}<br /></>}
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}<br />
              {order.shippingAddress.country}
            </p>
          </div>
        </Card>

        <div className="flex justify-center gap-4">
          <Button asChild variant="outline">
            <Link href="/">
              Continue Shopping
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild>
            <Link href="/brands">
              Explore More Brands
              <ShoppingBag className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
} 