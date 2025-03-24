"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Shield, User } from "lucide-react"
import { toast } from "sonner"
import { User as PrismaUser } from "@prisma/client"

interface UserWithCounts extends PrismaUser {
  _count?: {
    brands: number;
    affiliateLinks: number;
    orders: number;
  };
}

export function UserManagement() {
  const [users, setUsers] = useState<UserWithCounts[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users")
      if (!response.ok) throw new Error("Failed to fetch users")
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      toast.error("Failed to load users")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      })

      if (!response.ok) throw new Error("Failed to update user role")
      
      toast.success("User role updated successfully")
      fetchUsers() // Refresh the users list
    } catch (error) {
      toast.error("Failed to update user role")
      console.error(error)
    }
  }

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div>Loading users...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Search className="w-4 h-4 text-gray-500" />
        <Input
          placeholder="Search users by email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="grid gap-4">
        {filteredUsers.map((user) => (
          <Card key={user.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span className="font-medium">{user.email}</span>
                  {user.role === "superAdmin" && (
                    <Badge variant="destructive">
                      <Shield className="w-3 h-3 mr-1" />
                      Super Admin
                    </Badge>
                  )}
                  {user.role === "platformAdmin" && (
                    <Badge variant="secondary">
                      <Shield className="w-3 h-3 mr-1" />
                      Platform Admin
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Brands: {user._count?.brands || 0}</p>
                  <p>Last Active: {new Date(user.lastLoginAt).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {user.role !== "superAdmin" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRoleChange(user.id, "platformAdmin")}
                  >
                    Make Platform Admin
                  </Button>
                )}
                {user.role === "platformAdmin" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRoleChange(user.id, "user")}
                  >
                    Remove Admin
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
} 