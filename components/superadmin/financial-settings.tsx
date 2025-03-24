import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { useState } from "react"

export function FinancialSettings() {
  const [platformFee, setPlatformFee] = useState(0.1) // 10% default
  const [minimumPayout, setMinimumPayout] = useState(100)
  const [stripeConnectFee, setStripeConnectFee] = useState(0.029) // 2.9% default

  const handleSave = async () => {
    // TODO: Implement saving financial settings
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Platform Financial Settings</CardTitle>
          <CardDescription>
            Configure platform-wide financial parameters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Platform Fee (%)</label>
            <Input 
              type="number"
              value={platformFee * 100}
              onChange={(e) => setPlatformFee(Number(e.target.value) / 100)}
              min={0}
              max={100}
              step={0.1}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Minimum Payout Amount ($)</label>
            <Input 
              type="number"
              value={minimumPayout}
              onChange={(e) => setMinimumPayout(Number(e.target.value))}
              min={0}
              step={1}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Stripe Connect Fee (%)</label>
            <Input 
              type="number"
              value={stripeConnectFee * 100}
              onChange={(e) => setStripeConnectFee(Number(e.target.value) / 100)}
              min={0}
              max={100}
              step={0.1}
            />
          </div>
          <Button onClick={handleSave}>Save Settings</Button>
        </CardContent>
      </Card>
    </div>
  )
} 