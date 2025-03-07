"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/use-toast"
import { 
  Search, 
  MoreHorizontal, 
  UserCheck, 
  UserX, 
  Trash, 
  Mail, 
  AlertCircle 
} from "lucide-react"
import { AdminShell } from "@/components/admin/admin-shell"

export default function AdminUsersPage() {
  const { user, getAllBrands, suspendUser, activateUser } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<any[]>([])
  const [filteredUsers, setFilteredUsers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  // Redirect if not admin
  useEffect(() => {
    if (!user?.isAdmin) {
      router.push("/")
    }
  }, [user, router])

  // Load all users
  useEffect(() => {
    if (user?.isAdmin) {
      // In a real app, this would be an API call
      // For now, we'll simulate it by getting all users from the auth context
      const allUsers = Array.from(
        new Map(Object.entries(JSON.parse(localStorage.getItem('perchmerch_users') || '{}')))
      ).map(([_, userData]) => userData)
      
      setUsers(allUsers)
      setFilteredUsers(allUsers)
      setIsLoading(false)
    }
  }, [user])

  // Filter users based on search query
  useEffect(() => {
    if (searchQuery) {
      const filtered = users.filter(user => 
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      setFilteredUsers(filtered)
    } else {
      setFilteredUsers(users)
    }
  }, [searchQuery, users])

  const handleSuspendUser = async (userId: string) => {
    try {
      await suspendUser(userId)
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === userId ? { ...u, isActive: false } : u
        )
      )
      
      toast({
        title: "User Suspended",
        description: "The user has been suspended successfully."
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to suspend user",
        variant: "destructive"
      })
    }
  }

  const handleActivateUser = async (userId: string) => {
    try {
      await activateUser(userId)
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === userId ? { ...u, isActive: true } : u
        )
      )
      
      toast({
        title: "User Activated",
        description: "The user has been activated successfully."
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to activate user",
        variant: "destructive"
      })
    }
  }

  const handleDeleteUser = async (userId: string) => {
    // In a real app, this would be an API call
    // For now, we'll just remove from local state
    try {
      // Remove user from local storage
      const usersData = JSON.parse(localStorage.getItem('perchmerch_users') || '{}')
      const userToDelete = Object.entries(usersData).find(([_, u]: any) => u.id === userId)
      
      if (userToDelete) {
        const [username] = userToDelete
        delete usersData[username]
        localStorage.setItem('perchmerch_users', JSON.stringify(usersData))
        
        // Update local state
        setUsers(prevUsers => prevUsers.filter(u => u.id !== userId))
        
        toast({
          title: "User Deleted",
          description: "The user has been deleted successfully."
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive"
      })
    }
  }

  const getBrandCount = (userId: string) => {
    const allBrands = getAllBrands()
    return allBrands.filter(brand => brand.ownerId === userId).length
  }

  if (!user?.isAdmin) {
    return null
  }

  return (
    <AdminShell>
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Manage Users</h1>
        </div>

        <Card className="mb-8">
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search users by username or email..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-8">Loading users...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No users found matching your search criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Brands</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell>{user.email || "N/A"}</TableCell>
                        <TableCell>
                          {user.isActive === false ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Suspended
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Active
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.isAdmin ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              User
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{getBrandCount(user.id)}</TableCell>
                        <TableCell>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {user.isActive === false ? (
                                <DropdownMenuItem onClick={() => handleActivateUser(user.id)}>
                                  <UserCheck className="mr-2 h-4 w-4" />
                                  <span>Activate User</span>
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleSuspendUser(user.id)}>
                                  <UserX className="mr-2 h-4 w-4" />
                                  <span>Suspend User</span>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleDeleteUser(user.id)}>
                                <Trash className="mr-2 h-4 w-4" />
                                <span>Delete User</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </Card>
      </div>
    </AdminShell>
  )
} 