"use client"

import { useState, useEffect } from "react"
import { usePerchAuth } from "../../../hooks/usePerchAuth"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Search, Plus, CreditCard, Wallet, Building2 } from "lucide-react"
import { ScrollArea } from "../../../components/ui/scroll-area"
import { PaymentMethod } from "@prisma/client"

interface PaymentMethodConfig {
  name: string
  icon: string
  description: string
  setupUrl: string
}

interface PaymentMethodWithMetadata extends PaymentMethod {
  name: string
  icon: string
  description: string
  setupUrl: string
}

const PAYMENT_METHODS_CONFIG: Record<string, PaymentMethodConfig> = {
  stripe: {
    name: "Credit/Debit Cards",
    icon: "/icons/stripe.svg",
    description: "Accept all major credit and debit cards securely through Stripe",
    setupUrl: "/api/connect/stripe"
  },
  paypal: {
    name: "PayPal",
    icon: "/icons/paypal.svg",
    description: "Send and receive payments through PayPal",
    setupUrl: "/api/connect/paypal"
  },
  "google-pay": {
    name: "Google Pay",
    icon: "/icons/google-pay.svg",
    description: "Fast checkout with Google Pay",
    setupUrl: "/api/connect/google-pay"
  },
  "apple-pay": {
    name: "Apple Pay",
    icon: "/icons/apple-pay.svg",
    description: "Secure payments with Apple Pay",
    setupUrl: "/api/connect/apple-pay"
  },
  "shop-pay": {
    name: "Shop Pay",
    icon: "/icons/shop-pay.svg",
    description: "Fast checkout with Shop Pay",
    setupUrl: "/api/connect/shop-pay"
  },
  bank: {
    name: "Bank Account",
    icon: "/icons/bank.svg",
    description: "Receive payments directly to your bank account via ACH/Wire",
    setupUrl: "/api/connect/bank"
  },
  "paypal-business": {
    name: "PayPal Business",
    icon: "/icons/paypal-business.svg",
    description: "Receive payments to your PayPal Business account",
    setupUrl: "/api/connect/paypal-business"
  },
  "stripe-connect": {
    name: "Stripe Connect",
    icon: "/icons/stripe-connect.svg",
    description: "Receive payments through Stripe Connect",
    setupUrl: "/api/connect/stripe-connect"
  },
  wise: {
    name: "Wise Business",
    icon: "/icons/wise.svg",
    description: "Receive international payments with low fees",
    setupUrl: "/api/connect/wise"
  }
}

export default function PaymentMethodsPage() {
  const { isSignedIn, localUser } = usePerchAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodWithMetadata[]>([])

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const response = await fetch("/api/payment-methods")
        if (!response.ok) throw new Error("Failed to fetch payment methods")
        const data = await response.json()
        
        // Combine DB data with config data
        const enrichedMethods = data.map((method: PaymentMethod) => ({
          ...method,
          ...PAYMENT_METHODS_CONFIG[method.provider]
        }))
        setPaymentMethods(enrichedMethods)
      } catch (error) {
        console.error("Error fetching payment methods:", error)
      }
    }

    if (localUser) {
      fetchPaymentMethods()
    }
  }, [localUser])

  // Filter payment methods based on search and active tab
  const filteredMethods = paymentMethods.filter((method: PaymentMethodWithMetadata) => {
    const matchesSearch = method.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         method.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    if (activeTab === "pay") {
      return matchesSearch && (method.type === "pay" || method.type === "both")
    }
    if (activeTab === "receive") {
      return matchesSearch && (method.type === "receive" || method.type === "both")
    }
    if (activeTab === "both") {
      return matchesSearch && method.type === "both"
    }
    return matchesSearch
  })

  const handleConnect = async (method: PaymentMethodWithMetadata) => {
    try {
      const response = await fetch(method.setupUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      })

      if (!response.ok) {
        throw new Error("Failed to initiate connection")
      }

      const data = await response.json()
      // Redirect to the provider's OAuth flow or setup page
      window.location.href = data.url
    } catch (error) {
      console.error("Error connecting payment method:", error)
    }
  }

  return (
    <div className="container max-w-4xl py-10">
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>
            Manage your payment methods for buying from brands and receiving platform earnings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search payment methods..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <Tabs defaultValue="pay" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pay" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Pay Only
              </TabsTrigger>
              <TabsTrigger value="receive" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Receive Only
              </TabsTrigger>
              <TabsTrigger value="both" className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Both
              </TabsTrigger>
            </TabsList>

            {["pay", "receive", "both"].map((tab) => (
              <TabsContent key={tab} value={tab}>
                <ScrollArea className="h-[500px] pr-4">
                  <div className="grid gap-4">
                    {filteredMethods.map((method) => (
                      <Card key={method.id}>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="h-12 w-12 flex items-center justify-center rounded-lg border bg-muted">
                                <img
                                  src={method.icon}
                                  alt={method.name}
                                  className="h-8 w-8"
                                />
                              </div>
                              <div>
                                <h3 className="font-semibold">{method.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {method.description}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant={method.isDefault ? "secondary" : "default"}
                              onClick={() => handleConnect(method)}
                              className="flex items-center gap-2"
                            >
                              <Plus className="h-4 w-4" />
                              {method.isDefault ? "Default" : "Connect"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
