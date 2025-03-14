"use client"

import { useState, useEffect, useRef } from "react"
import { useUser } from "@clerk/nextjs"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BrandsList } from "@/components/admin/brands-list"
import { FeaturedBrandManager } from "@/components/admin/featured-brand-manager"
import { BrandApprovalManager } from "@/components/admin/brand-approval-manager"
import { AlertTriangle, CheckCircle, Shield, Star, Users } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function AdminDashboard() {
  const { user, isLoaded } = useUser()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isSuperAdmin, setIsAdmin] = useState(false)
  const [isCheckingUser, setIsCheckingUser] = useState(false)
  const hasCheckedUser = useRef(false)

  useEffect(() => {
    const checkUser = async () => {
      // Only check once and only when user is loaded
      if (hasCheckedUser.current || !user?.id || isCheckingUser) return
      
      try {
        setIsCheckingUser(true)
        console.log("Checking user role for admin access...")
        
        const res = await fetch(`/api/users/check?userId=${user.id}`)
        const data = await res.json()
        
        console.log("User role check result:", data)
        
        setUserRole(data.role)
        setIsAdmin(data.isSuperAdmin || data.isPlatformAdmin)
        hasCheckedUser.current = true
      } catch (error) {
        console.error("Error checking user role:", error)
      } finally {
        setIsCheckingUser(false)
      }
    }
    
    if (isLoaded && user) {
      checkUser()
    }
  }, [isLoaded, user, isCheckingUser])

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

  if (!isSuperAdmin) {
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
        
        <p className="mb-4">
          If you believe you should have admin access, please visit the admin access page to check your status
          and initialize your superAdmin privileges.
        </p>
        
        <div className="flex gap-4">
          <Button asChild>
            <Link href="/admin-access">Admin Access Page</Link>
          </Button>
          
          <Button asChild variant="outline">
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Your role: <span className="font-medium">{userRole}</span>
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Brands
            </CardTitle>
            <CardDescription>Manage all brand accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">0</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Approved Brands
            </CardTitle>
            <CardDescription>Active brands on the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">0</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" />
              Featured Brands
            </CardTitle>
            <CardDescription>Highlighted on the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">0</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all-brands" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all-brands">All Brands</TabsTrigger>
          <TabsTrigger value="brand-approvals">Brand Approvals</TabsTrigger>
          <TabsTrigger value="featured-brands">Featured Brands</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all-brands" className="mt-4">
          <BrandsList />
        </TabsContent>
        
        <TabsContent value="brand-approvals" className="mt-4">
          <BrandApprovalManager />
        </TabsContent>
        
        <TabsContent value="featured-brands" className="mt-4">
          <FeaturedBrandManager />
        </TabsContent>
      </Tabs>
    </div>
  )
} 