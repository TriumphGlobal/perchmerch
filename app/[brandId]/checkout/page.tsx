"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { usePerchAuth } from "../../../hooks/usePerchAuth"
import { Button } from "../../../components/ui/button"
import { Card, CardContent } from "../../../components/ui/card"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { toast } from "../../../components/ui/use-toast"
import { 
  Loader2,
  CreditCard,
  Truck,
  ShoppingCart,
  ChevronLeft
} from "lucide-react"
import { orderService } from "../../../lib/services/order"
import { processImageForProduct } from "../../../lib/utils"

interface CheckoutItem {
  productId: string;
  variantId: string;
  quantity: number;
  title: string;
  price: number;
  image: string;
}

export default function CheckoutPage({ params }: { params: { brandId: string } }) {
  const { brandId } = params
  const { user, getAllBrands } = useAuth()
  const router = useRouter()
  
  const [brand, setBrand] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [items, setItems] = useState<CheckoutItem[]>([])
  const [shippingAddress, setShippingAddress] = useState({
    firstName: "",
    lastName: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    country: "",
    zipCode: "",
    phone: ""
  })
  
  // Load brand and cart data
  useEffect(() => {
    const allBrands = getAllBrands()
    const currentBrand = allBrands.find(b => b.id === brandId)
    
    if (currentBrand) {
      setBrand(currentBrand)
      
      // Load cart items from localStorage
      const cartData = localStorage.getItem(`cart_${brandId}`)
      if (cartData) {
        setItems(JSON.parse(cartData))
      }
    }
    
    setLoading(false)
  }, [brandId, getAllBrands])
  
  const calculateTotal = () => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0)
  }
  
  const handleUpdateQuantity = (productId: string, variantId: string, newQuantity: number) => {
    if (newQuantity < 1) return
    
    setItems(prev => {
      const updated = prev.map(item => 
        item.productId === productId && item.variantId === variantId
          ? { ...item, quantity: newQuantity }
          : item
      )
      
      // Update localStorage
      localStorage.setItem(`cart_${brandId}`, JSON.stringify(updated))
      
      return updated
    })
  }
  
  const handleRemoveItem = (productId: string, variantId: string) => {
    setItems(prev => {
      const updated = prev.filter(item => 
        !(item.productId === productId && item.variantId === variantId)
      )
      
      // Update localStorage
      localStorage.setItem(`cart_${brandId}`, JSON.stringify(updated))
      
      return updated
    })
  }
  
  const handlePlaceOrder = async () => {
    if (!user) {
      toast({
        title: "Please Log In",
        description: "You need to be logged in to place an order",
        variant: "destructive"
      })
      router.push("/sign-in")
      return
    }
    
    // Validate shipping address
    const requiredFields = ['firstName', 'lastName', 'address1', 'city', 'country', 'zipCode'] as const
    for (const field of requiredFields) {
      if (!shippingAddress[field]) {
        toast({
          title: "Missing Information",
          description: `Please enter your ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`,
          variant: "destructive"
        })
        return
      }
    }
    
    try {
      setIsProcessing(true)
      
      // Create order
      const order = await orderService.createOrder({
        userId: user.id,
        brandId: brand.id,
        items: items.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity
        })),
        shippingAddress
      })
      
      // Clear cart
      localStorage.removeItem(`cart_${brandId}`)
      
      // Show success message
      toast({
        title: "Order Placed",
        description: "Your order has been placed successfully"
      })
      
      // Redirect to order confirmation
      router.push(`/account/orders/${order.order.id}`)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to place order",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }
  
  if (loading) {
    return <div className="container mx-auto p-8">Loading...</div>
  }
  
  if (!brand) {
    return <div className="container mx-auto p-8">Brand not found</div>
  }
  
  if (items.length === 0) {
    return (
      <div className="container mx-auto p-8 text-center">
        <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Your Cart is Empty</h1>
        <p className="text-muted-foreground mb-4">
          Add some products to your cart to get started
        </p>
        <Button onClick={() => router.push(`/${brandId}`)}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Continue Shopping
        </Button>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <Card className="mb-8">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Truck className="mr-2 h-5 w-5" />
                Shipping Information
              </h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>First Name</Label>
                  <Input
                    value={shippingAddress.firstName}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="Enter your first name"
                  />
                </div>
                
                <div>
                  <Label>Last Name</Label>
                  <Input
                    value={shippingAddress.lastName}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Enter your last name"
                  />
                </div>
                
                <div className="col-span-2">
                  <Label>Address Line 1</Label>
                  <Input
                    value={shippingAddress.address1}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, address1: e.target.value }))}
                    placeholder="Enter your street address"
                  />
                </div>
                
                <div className="col-span-2">
                  <Label>Address Line 2 (Optional)</Label>
                  <Input
                    value={shippingAddress.address2}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, address2: e.target.value }))}
                    placeholder="Apartment, suite, etc."
                  />
                </div>
                
                <div>
                  <Label>City</Label>
                  <Input
                    value={shippingAddress.city}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Enter your city"
                  />
                </div>
                
                <div>
                  <Label>State/Province</Label>
                  <Input
                    value={shippingAddress.state}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="Enter your state"
                  />
                </div>
                
                <div>
                  <Label>Country</Label>
                  <Input
                    value={shippingAddress.country}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, country: e.target.value }))}
                    placeholder="Enter your country"
                  />
                </div>
                
                <div>
                  <Label>ZIP/Postal Code</Label>
                  <Input
                    value={shippingAddress.zipCode}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, zipCode: e.target.value }))}
                    placeholder="Enter your ZIP code"
                  />
                </div>
                
                <div className="col-span-2">
                  <Label>Phone (Optional)</Label>
                  <Input
                    value={shippingAddress.phone}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={`${item.productId}_${item.variantId}`} className="flex gap-4">
                    <div className="relative w-20 h-20">
                      <Image
                        src={processImageForProduct(item.image)}
                        alt={item.title}
                        fill
                        className="object-cover rounded-md"
                      />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-medium">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        ${item.price.toFixed(2)} x {item.quantity}
                      </p>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleUpdateQuantity(item.productId, item.variantId, item.quantity - 1)}
                        >
                          -
                        </Button>
                        <span className="text-sm">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleUpdateQuantity(item.productId, item.variantId, item.quantity + 1)}
                        >
                          +
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 ml-2"
                          onClick={() => handleRemoveItem(item.productId, item.variantId)}
                        >
                          Remove
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
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between mb-2">
                  <span>Subtotal</span>
                  <span className="font-medium">${calculateTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground mb-4">
                  <span>Shipping</span>
                  <span>Calculated at next step</span>
                </div>
                
                <Button
                  className="w-full"
                  onClick={handlePlaceOrder}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="mr-2 h-4 w-4" />
                  )}
                  {isProcessing ? "Processing..." : "Place Order"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 