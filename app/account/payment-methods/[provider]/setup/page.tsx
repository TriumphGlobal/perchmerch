"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../components/ui/card"
import { Button } from "../../../../../components/ui/button"
import { Input } from "../../../../../components/ui/input"
import { Label } from "../../../../../components/ui/label"
import { usePerchAuth } from "../../../../../hooks/usePerchAuth"

interface SetupFormData {
  accountNumber?: string
  routingNumber?: string
  accountType?: "checking" | "savings"
  bankName?: string
  accountHolderName?: string
}

export default function PaymentMethodSetupPage({
  params
}: {
  params: { provider: string }
}) {
  const router = useRouter()
  const { isSignedIn, localUser } = usePerchAuth()
  const [formData, setFormData] = useState<SetupFormData>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isSignedIn) {
      router.push("/sign-in")
      return
    }
  }, [isSignedIn, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/payment-methods", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          provider: params.provider,
          ...formData
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to set up payment method")
      }

      router.push("/account/payment-methods")
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const renderSetupForm = () => {
    switch (params.provider) {
      case "bank":
        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accountHolderName">Account Holder Name</Label>
              <Input
                id="accountHolderName"
                value={formData.accountHolderName || ""}
                onChange={(e) =>
                  setFormData({ ...formData, accountHolderName: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                value={formData.bankName || ""}
                onChange={(e) =>
                  setFormData({ ...formData, bankName: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="routingNumber">Routing Number</Label>
              <Input
                id="routingNumber"
                value={formData.routingNumber || ""}
                onChange={(e) =>
                  setFormData({ ...formData, routingNumber: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input
                id="accountNumber"
                type="password"
                value={formData.accountNumber || ""}
                onChange={(e) =>
                  setFormData({ ...formData, accountNumber: e.target.value })
                }
                required
              />
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Setting up..." : "Connect Bank Account"}
            </Button>
          </form>
        )
      default:
        return (
          <div className="text-center">
            <p>Setup page for {params.provider} is not yet implemented.</p>
            <Button
              onClick={() => router.push("/account/payment-methods")}
              className="mt-4"
            >
              Go Back
            </Button>
          </div>
        )
    }
  }

  return (
    <div className="container max-w-2xl py-10">
      <Card>
        <CardHeader>
          <CardTitle>Set Up {params.provider}</CardTitle>
          <CardDescription>
            Connect your {params.provider} account to start receiving payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-4 text-sm text-red-800 bg-red-100 rounded-lg">
              {error}
            </div>
          )}
          {renderSetupForm()}
        </CardContent>
      </Card>
    </div>
  )
} 