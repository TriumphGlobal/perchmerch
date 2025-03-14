"use client"

import { useState, useEffect, useRef } from "react"
import { useUser } from "@clerk/nextjs"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { 
  AlertTriangle, 
  ArrowLeft,
  CheckCircle, 
  Clock,
  Crown,
  DollarSign,
  Loader2, 
  Shield,
  ShoppingCart,
  Store,
  User,
  Users
} from "lucide-react"

interface UserDetails {
  id: string
  name: string | null
  email: string | null
  role: string
  isSuperAdmin: boolean
  isPlatformAdmin: boolean
  createdAt: string
  // These would be populated in a full implementation
  brandCount?: number
  orderCount?: number
  totalSales?: number
  lastsign-inAt?: string
}

export default function AdminUserDetailsPage({ params }: { params: { userId: string } }) {
  const { user, isLoaded } = useUser()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isCheckingUser, setIsCheckingUser] = useState(false)
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasCheckedUser = useRef(false)

  // Check if current user has admin privileges
  useEffect(() => {
    const checkUser = async () => {
      // Only check once and only when user is loaded
      if (hasCheckedUser.current || !user?.id || isCheckingUser) return
      
      try {
        setIsCheckingUser(true)
        console.log("Admin User Details: Checking user role...")
        
        const res = await fetch(`/api/users/check?userId=${user.id}`)
        const data = await res.json()
        
        console.log("Admin User Details: User role check result:", data)
        
        setUserRole(data.role)
        setIsAdmin(data.isSuperAdmin || data.isPlatformAdmin)
        hasCheckedUser.current = true
      } catch (error) {
        console.error("Admin User Details: Error checking user role:", error)
        setError("Could not verify admin access")
      } finally {
        setIsCheckingUser(false)
      }
    }
    
    if (isLoaded && user) {
      checkUser()
    }
  }, [isLoaded, user, isCheckingUser])

  // Fetch user details
  useEffect(() => {
    if (!isAdmin || !params.userId) return

    const fetchUserDetails = async () => {
      try {
        setIsLoading(true)
        console.log(`Admin User Details: Fetching details for user ${params.userId}...`)
        
        const response = await fetch(`/api/admin/users/${params.userId}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch user details')
        }
        
        const data = await response.json()
        console.log("Admin User Details: Fetched user details:", data)
        
        setUserDetails(data.user)
      } catch (error) {
        console.error('Admin User Details: Error fetching user details:', error)
        setError('Failed to load user details. Please try again later.')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchUserDetails()
  }, [isAdmin, params.userId])

  if (!isLoaded || isCheckingUser) {
    return <div className="p-8">Loading...</div>
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
              Your role: <span className="font-semibold">{userRole || "user"}</span>
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
      <div className="mb-2">
        <Link href="/admin/users" className="text-muted-foreground hover:text-foreground flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Users List
        </Link>
      </div>
      
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <User className="h-8 w-8 text-primary" />
            User Details
          </h1>
          <p className="text-muted-foreground mt-1">
            View and manage user information
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

      {isLoading ? (
        // Loading skeleton
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-72 mt-2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : !userDetails ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>The requested user was not found.</AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          {/* User Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
              <CardDescription>
                Basic user account information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="space-y-4 flex-1">
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Name</h3>
                    <p className="text-lg font-medium">{userDetails.name || "Unnamed User"}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Email</h3>
                    <p className="text-lg">{userDetails.email || "No email provided"}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">User ID</h3>
                    <p className="text-sm font-mono bg-muted p-2 rounded">{userDetails.id}</p>
                  </div>
                </div>
                
                <div className="space-y-4 flex-1">
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Role</h3>
                    <div className="flex gap-2">
                      {userDetails.isSuperAdmin ? (
                        <Badge variant="outline" className="bg-purple-100 text-purple-800 hover:bg-purple-100 border-purple-200 flex items-center gap-1">
                          <Crown className="h-3 w-3" />
                          Super Admin
                        </Badge>
                      ) : userDetails.isPlatformAdmin ? (
                        <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200 flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          Platform Admin
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Regular User
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Created On</h3>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(userDetails.createdAt).toLocaleDateString()} at {new Date(userDetails.createdAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Last sign-in</h3>
                    <p>{userDetails.lastsign-inAt ? new Date(userDetails.lastsign-inAt).toLocaleString() : "No sign-in data available"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs for different user data */}
          <Tabs defaultValue="brands">
            <TabsList>
              <TabsTrigger value="brands">
                <Store className="h-4 w-4 mr-2" />
                Brands
              </TabsTrigger>
              <TabsTrigger value="orders">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Orders
              </TabsTrigger>
              <TabsTrigger value="earnings">
                <DollarSign className="h-4 w-4 mr-2" />
                Earnings
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="brands" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="h-5 w-5" />
                    User's Brands
                  </CardTitle>
                  <CardDescription>
                    Brands created and managed by this user
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <p>Brand information will be loaded here.</p>
                    <p className="text-sm mt-2">This feature is not fully implemented in the demo.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="orders" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Order History
                  </CardTitle>
                  <CardDescription>
                    Orders placed by or through this user
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <p>Order information will be loaded here.</p>
                    <p className="text-sm mt-2">This feature is not fully implemented in the demo.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="earnings" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Earnings Information
                  </CardTitle>
                  <CardDescription>
                    Revenue and earnings statistics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <p>Earnings information will be loaded here.</p>
                    <p className="text-sm mt-2">This feature is not fully implemented in the demo.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
} 