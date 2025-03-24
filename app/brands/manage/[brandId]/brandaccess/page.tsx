"use client"

import { useState, useEffect } from "react"
import { usePerchAuth } from "@/hooks/usePerchAuth"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Loader2, UserPlus, Shield, Users, AlertTriangle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface BrandAccessUser {
  email: string
  role: "owner" | "manager"
  createdAt: string
}

export default function BrandAccessPage({ params }: { params: { brandId: string } }) {
  const { brandId } = params
  const router = useRouter()
  const { isLoaded, isSignedIn, localUser } = usePerchAuth()
  const [loading, setLoading] = useState(true)
  const [isOwner, setIsOwner] = useState(false)
  const [users, setUsers] = useState<BrandAccessUser[]>([])
  const [newManagerEmail, setNewManagerEmail] = useState("")
  const [newOwnerEmail, setNewOwnerEmail] = useState("")
  const [showTransferDialog, setShowTransferDialog] = useState(false)

  useEffect(() => {
    if (isLoaded && (!isSignedIn || !localUser)) {
      router.push("/sign-in")
      return
    }

    const loadBrandAccess = async () => {
      try {
        const response = await fetch(`/api/brands/${brandId}/access`)
        if (!response.ok) {
          throw new Error('Failed to load brand access')
        }
        const data = await response.json()
        setUsers(data.users)
        setIsOwner(data.isOwner)
      } catch (error) {
        console.error('Error loading brand access:', error)
        toast({
          title: "Error",
          description: "Failed to load brand access information",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    if (localUser) {
      loadBrandAccess()
    }
  }, [brandId, isLoaded, isSignedIn, localUser, router])

  const handleAddManager = async () => {
    if (!newManagerEmail) return

    try {
      const response = await fetch(`/api/brands/${brandId}/access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newManagerEmail,
          role: 'manager'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to add manager')
      }

      const data = await response.json()
      setUsers([...users, data])
      setNewManagerEmail("")
      
      toast({
        title: "Manager added",
        description: "The user has been granted manager access to this brand."
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add manager",
        variant: "destructive"
      })
    }
  }

  const handleRemoveAccess = async (email: string) => {
    try {
      const response = await fetch(`/api/brands/${brandId}/access`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      })

      if (!response.ok) {
        throw new Error('Failed to remove access')
      }

      setUsers(users.filter(user => user.email !== email))
      
      toast({
        title: "Access removed",
        description: "The user's access has been removed."
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove access",
        variant: "destructive"
      })
    }
  }

  const handleTransferOwnership = async () => {
    if (!newOwnerEmail) return

    try {
      const response = await fetch(`/api/brands/${brandId}/transfer-ownership`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newOwnerEmail })
      })

      if (!response.ok) {
        throw new Error('Failed to transfer ownership')
      }

      // Update the users list
      const updatedUsers = users.map(user => {
        if (user.email === localUser?.email) {
          return { ...user, role: 'manager' }
        }
        if (user.email === newOwnerEmail) {
          return { ...user, role: 'owner' }
        }
        return user
      })

      SetUser(updatedUsers)
      setIsOwner(false)
      setShowTransferDialog(false)
      setNewOwnerEmail("")
      
      toast({
        title: "Ownership transferred",
        description: "Brand ownership has been transferred successfully."
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to transfer ownership",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6 flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!isOwner) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="py-10">
            <div className="text-center space-y-4">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground" />
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Access Restricted</h3>
                <p className="text-sm text-muted-foreground">
                  Only the brand owner can manage access permissions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold">Brand Access</h1>
          <p className="text-muted-foreground">
            Manage who has access to your brand
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Current Access</CardTitle>
            <CardDescription>People who can manage this brand</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.email} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{user.email}</p>
                    <p className="text-sm text-muted-foreground">
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)} • Added {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {user.role !== 'owner' && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveAccess(user.email)}
                    >
                      Remove Access
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Add Manager</CardTitle>
              <CardDescription>Grant management access to another user</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={newManagerEmail}
                  onChange={(e) => setNewManagerEmail(e.target.value)}
                />
                <Button onClick={handleAddManager}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Transfer Ownership</CardTitle>
              <CardDescription>Transfer brand ownership to another user</CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Shield className="h-4 w-4 mr-2" />
                    Transfer Ownership
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Transfer Brand Ownership</DialogTitle>
                    <DialogDescription>
                      This action cannot be undone. The new owner will have full control over the brand,
                      including the ability to remove your access.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="flex items-center p-4 border rounded-lg bg-yellow-50">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3" />
                      <p className="text-sm text-yellow-600">
                        You will lose owner privileges after the transfer
                      </p>
                    </div>
                    <Input
                      type="email"
                      placeholder="Enter new owner's email"
                      value={newOwnerEmail}
                      onChange={(e) => setNewOwnerEmail(e.target.value)}
                    />
                    <Button
                      className="w-full"
                      variant="destructive"
                      onClick={handleTransferOwnership}
                    >
                      Confirm Transfer
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 