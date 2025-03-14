"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useUser } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { 
  ChevronLeft,
  Package,
  Truck,
  MapPin,
  Clock,
  CheckCircle2
} from "lucide-react"
import { orderService } from "@/lib/services/order"
import { processImageForProduct } from "@/lib/utils"

export default function OrderConfirmationPage({ params }: { params: { orderId: string } }) {
  const { orderId } = params
  const { user } = useAuth()
  const router = useRouter()
  
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    if (!user) {
      router.push("/sign-in")
      return
    }
    
    const loadOrder = async () => {
      try {
        const orderData = await orderService.getOrder(orderId)
        
        if (!orderData) {
          toast({
            title: "Order Not Found",
            description: "The requested order could not be found",
            variant: "destructive"
          })
          router.push("/account/orders")
          return
        }
        
        // Verify the order belongs to the current user
        if (orderData.userId !== user.id) {
          toast({
            title: "Access Denied",
            description: "You don't have permission to view this order",
            variant: "destructive"
          })
          router.push("/account/orders")
          return
        }
        
        setOrder(orderData)
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load order",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }
    
    loadOrder()
  }, [orderId, user, router])
  
  if (loading) {
    return <div className="container mx-auto p-8">Loading...</div>
  }
  
  if (!order) {
    return null
  }
  
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
  
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'shipped':
        return 'bg-green-100 text-green-800'
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }
  
  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Order #{order.orderNumber}</h1>
          <p className="text-muted-foreground">
            Placed on {formatDate(order.createdAt)}
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push("/account/orders")}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="mb-8">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Package className="mr-2 h-5 w-5" />
                Order Items
              </h2>
              
              <div className="space-y-4">
                {order.items.map((item: any) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="relative w-20 h-20">
                      <Image
                        src={processImageForProduct(item.product.image)}
                        alt={item.product.title}
                        fill
                        className="object-cover rounded-md"
                      />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-medium">{item.product.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        ${item.price.toFixed(2)} x {item.quantity}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Variant: {item.variant.title}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-medium">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                Order Status
              </h2>
              
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
                
                {order.status === 'delivered' && (
                  <div className="flex items-center text-green-600">
                    <CheckCircle2 className="mr-1 h-4 w-4" />
                    <span className="text-sm">Delivered on {formatDate(order.updatedAt)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card className="mb-8">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <MapPin className="mr-2 h-5 w-5" />
                Shipping Address
              </h2>
              
              <div className="space-y-1">
                <p>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                <p>{order.shippingAddress.address1}</p>
                {order.shippingAddress.address2 && (
                  <p>{order.shippingAddress.address2}</p>
                )}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                </p>
                <p>{order.shippingAddress.country}</p>
                {order.shippingAddress.phone && (
                  <p className="text-muted-foreground">{order.shippingAddress.phone}</p>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${(order.total - order.shippingCost).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>${order.shippingCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-medium border-t pt-2 mt-2">
                  <span>Total</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 