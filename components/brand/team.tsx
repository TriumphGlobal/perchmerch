"use client"

import { useState } from "react"
import { Brand } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { UserPlus, X } from "lucide-react"

interface TeamProps {
  brand: Brand & {
    products: any[]
    brandAccess: any[]
    socialMedia: any[]
    genres: any[]
    _count: {
      products: number
    }
  }
}

export function Team({ brand }: TeamProps) {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("manager")

  const handleInvite = async () => {
    try {
      const response = await fetch(`/api/brands/${brand.brandId}/team`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          role,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to invite team member")
      }

      toast.success("Team member invited successfully")
      setEmail("")
    } catch (error) {
      toast.error("Failed to invite team member")
    }
  }

  const handleRemove = async (userEmail: string) => {
    try {
      const response = await fetch(`/api/brands/${brand.brandId}/team`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userEmail,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to remove team member")
      }

      toast.success("Team member removed successfully")
    } catch (error) {
      toast.error("Failed to remove team member")
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Invite Team Member</CardTitle>
          <CardDescription>
            Add new members to help manage your brand
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                placeholder="Enter email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="w-[200px]">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleInvite} disabled={!email}>
                <UserPlus className="mr-2 h-4 w-4" />
                Invite
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            Manage your brand's team members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {brand.brandAccess.map((access) => (
              <div
                key={access.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div>
                  <div className="font-medium">{access.userEmail}</div>
                  <div className="text-sm text-muted-foreground capitalize">
                    {access.role}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(access.userEmail)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 