"use client"

import { useState, useEffect, useRef } from "react"
import { useUser } from "@clerk/nextjs"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { 
  AlertTriangle, 
  ArrowLeft,
  CheckCircle, 
  Crown,
  Loader2, 
  MoreHorizontal, 
  Search, 
  Shield, 
  Users,
  XCircle
} from "lucide-react"
import { USER_ROLES, UserRole, ROLE_LABELS, ROLE_DESCRIPTIONS, hasRolePermission } from "@/lib/roles"

interface User {
  id: string
  name: string | null
  email: string | null
  role: UserRole
  isSuperAdmin: boolean
  isPlatformAdmin: boolean
  createdAt: string
}

export default function AdminUsersPage() {
  const { user, isLoaded } = useUser()
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isCheckingUser, setIsCheckingUser] = useState(false)
  const [usersList, setUsersList] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasCheckedUser = useRef(false)
  const hasLoadedUsers = useRef(false)

  // Check if current user has admin privileges
  useEffect(() => {
    const checkUser = async () => {
      if (hasCheckedUser.current || !user?.id || isCheckingUser) return
      
      try {
        setIsCheckingUser(true)
        const res = await fetch(`/api/users/check?userId=${user.id}`)
        const data = await res.json()
        
        setUserRole(data.role as UserRole)
        setIsAdmin(data.isSuperAdmin || data.isPlatformAdmin)
        hasCheckedUser.current = true
      } catch (error) {
        console.error("Error checking user role:", error)
        setError("Could not verify admin access")
      } finally {
        setIsCheckingUser(false)
      }
    }
    
    if (isLoaded && user) {
      checkUser()
    }
  }, [isLoaded, user, isCheckingUser])

  // Fetch all users
  useEffect(() => {
    if (!isAdmin || hasLoadedUsers.current) return

    const fetchUsers = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/admin/users')
        
        if (!response.ok) {
          throw new Error('Failed to fetch users')
        }
        
        const data = await response.json()
        setUsersList(data.users || [])
        hasLoadedUsers.current = true
      } catch (error) {
        console.error('Error fetching users:', error)
        setError('Failed to load users. Please try again later.')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchUsers()
  }, [isAdmin])

  // Filter users based on search
  const filteredUsers = usersList.filter(user => {
    const searchLower = searchQuery.toLowerCase()
    return (
      (user.name?.toLowerCase().includes(searchLower) || false) ||
      (user.email?.toLowerCase().includes(searchLower) || false) ||
      ROLE_LABELS[user.role].toLowerCase().includes(searchLower)
    )
  })

  // Handle role change
  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      // Only allow role changes if current user is super admin
      if (userRole !== USER_ROLES.SUPER_ADMIN) {
        throw new Error('Only Super Admins can change user roles')
      }

      // Don't allow changing own role
      if (userId === user?.id) {
        throw new Error('Cannot change your own role')
      }

      const endpoint = newRole === USER_ROLES.SUPER_ADMIN 
        ? `/api/admin/users/${userId}/promote-super`
        : newRole === USER_ROLES.PLATFORM_ADMIN 
          ? `/api/admin/users/${userId}/promote-platform`
          : `/api/admin/users/${userId}/demote`

      const response = await fetch(endpoint, {
        method: 'POST'
      })
      
      if (!response.ok) {
        throw new Error(`Failed to change user role to ${ROLE_LABELS[newRole]}`)
      }
      
      // Update the user in the list
      setUsersList(prev => 
        prev.map(user => 
          user.id === userId 
            ? { 
                ...user, 
                role: newRole,
                isSuperAdmin: newRole === USER_ROLES.SUPER_ADMIN,
                isPlatformAdmin: newRole === USER_ROLES.PLATFORM_ADMIN || newRole === USER_ROLES.SUPER_ADMIN
              } 
            : user
        )
      )
    } catch (error) {
      console.error('Error changing user role:', error)
      setError(error instanceof Error ? error.message : 'Failed to change user role')
    }
  }

  if (!isLoaded || isCheckingUser) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Unauthorized</h1>
        <p>Please sign in to access the admin dashboard.</p>
        <Button asChild className="mt-4">
          <Link href="/signin">Sign In</Link>
        </Button>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="p-8">
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="text-lg font-bold">Access Restricted</AlertTitle>
          <AlertDescription>
            You don't have permission to access the admin dashboard.
            <br />
            <span className="block mt-2">
              Your role: <span className="font-semibold">{userRole ? ROLE_LABELS[userRole] : "User"}</span>
            </span>
          </AlertDescription>
        </Alert>
        
        <Button asChild className="mt-4">
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="mb-2">
            <Link href="/admin" className="text-muted-foreground hover:text-foreground flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Admin Dashboard
            </Link>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Users Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and view all users on the platform
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            View and manage all users registered on the platform
          </CardDescription>
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.name || "N/A"}</TableCell>
                    <TableCell>{user.email || "N/A"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {user.role === USER_ROLES.SUPER_ADMIN ? (
                          <Crown className="h-4 w-4 text-yellow-500" />
                        ) : user.role === USER_ROLES.PLATFORM_ADMIN ? (
                          <Shield className="h-4 w-4 text-blue-500" />
                        ) : (
                          <Users className="h-4 w-4 text-gray-500" />
                        )}
                        {ROLE_LABELS[user.role]}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {userRole === USER_ROLES.SUPER_ADMIN && user.id !== user?.id && (
                            <>
                              {Object.entries(USER_ROLES).map(([key, role]) => (
                                <DropdownMenuItem
                                  key={role}
                                  onClick={() => handleRoleChange(user.id, role)}
                                  disabled={user.role === role}
                                >
                                  {user.role === role ? (
                                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                                  ) : (
                                    <div className="w-4 h-4 mr-2" />
                                  )}
                                  Set as {ROLE_LABELS[role]}
                                  <div className="ml-4 text-xs text-muted-foreground">
                                    {ROLE_DESCRIPTIONS[role]}
                                  </div>
                                </DropdownMenuItem>
                              ))}
                            </>
                          )}
                          <DropdownMenuItem asChild>
                            <Link href={`/superadmin/users/${user.id}`}>
                              View Details
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 