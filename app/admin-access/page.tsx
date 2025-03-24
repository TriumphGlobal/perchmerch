"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import Link from "next/link"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert"
import { Shield, AlertTriangle, CheckCircle, ArrowRight } from "lucide-react"

const SUPERADMIN_EMAIL = "sales@triumphglobal.net"

const CardFooter = ({ children }: { children: React.ReactNode }) => (
  <div className="px-6 py-4 flex items-center justify-between border-t">
    {children}
  </div>
);

export default function AdminAccessPage() {
  const { user, isLoaded } = useUser()
  const [adminStatus, setAdminStatus] = useState<any>(null)
  const [isInitializing, setIsInitializing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const checkAdminStatus = async () => {
    if (!user?.id) return
    
    try {
      const res = await fetch(`/api/users/check?userId=${user.id}`)
      const data = await res.json()
      setAdminStatus(data)
    } catch (err) {
      console.error("Error checking admin status:", err)
      setError("Failed to check admin status")
    }
  }

  const initializeSuperAdmin = async () => {
    setIsInitializing(true)
    setError(null)
    setSuccess(null)
    
    try {
      const res = await fetch("/api/init-superadmin")
      const data = await res.json()
      
      if (data.success) {
        setSuccess("SuperAdmin privileges granted successfully!")
        await checkAdminStatus()
      } else {
        setError(data.message || "Failed to initialize SuperAdmin")
      }
    } catch (err) {
      console.error("Error initializing SuperAdmin:", err)
      setError("An error occurred while initializing SuperAdmin")
    } finally {
      setIsInitializing(false)
    }
  }

  useEffect(() => {
    if (isLoaded && user) {
      checkAdminStatus()
    }
  }, [isLoaded, user])

  if (!isLoaded) {
    return <div className="container py-8">Loading...</div>
  }

  if (!user) {
    return (
      <div className="container py-8">
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Not Signed In</AlertTitle>
          <AlertDescription>
            You need to sign in to access the admin panel.
          </AlertDescription>
        </Alert>
        
        <Button asChild>
          <Link href="/sign-in">Sign In</Link>
        </Button>
      </div>
    )
  }

  const email = user.primaryEmailAddress?.emailAddress
  const isSuperAdminEmail = email === SUPERADMIN_EMAIL
  const isAdmin = adminStatus?.isSuperAdmin || adminStatus?.isPlatformAdmin

  return (
    <div className="container py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <Shield className="h-8 w-8 text-primary" />
        Admin Access
      </h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>User Information</CardTitle>
          <CardDescription>Your current user details and permissions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-medium">Email:</p>
            <p className="text-muted-foreground">{email}</p>
          </div>
          
          <div>
            <p className="font-medium">SuperAdmin Email Match:</p>
            {isSuperAdminEmail ? (
              <p className="text-green-600 flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                Yes - This email matches the SuperAdmin email
              </p>
            ) : (
              <p className="text-red-600 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                No - This email does not match the SuperAdmin email
              </p>
            )}
          </div>
          
          <div>
            <p className="font-medium">Current Permissions:</p>
            {adminStatus ? (
              <div className="space-y-1">
                <p>Role: <span className="font-semibold">{adminStatus.role || "user"}</span></p>
                <p>SuperAdmin: <span className="font-semibold">{adminStatus.isSuperAdmin ? "Yes" : "No"}</span></p>
                <p>PlatformAdmin: <span className="font-semibold">{adminStatus.isPlatformAdmin ? "Yes" : "No"}</span></p>
              </div>
            ) : (
              <p className="text-muted-foreground">Loading permissions...</p>
            )}
          </div>
        </CardContent>
      </Card>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="mb-6 border-green-600 text-green-600">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>SuperAdmin Initialization</CardTitle>
          <CardDescription>
            {isSuperAdminEmail 
              ? "Initialize your account with SuperAdmin privileges" 
              : "Only accounts with the SuperAdmin email can be initialized"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSuperAdminEmail ? (
            isAdmin ? (
              <Alert className="border-green-600 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Already Initialized</AlertTitle>
                <AlertDescription>
                  Your account already has SuperAdmin privileges.
                </AlertDescription>
              </Alert>
            ) : (
              <p>
                Your email matches the SuperAdmin email, but you don't have SuperAdmin privileges yet.
                Click the button below to initialize your account.
              </p>
            )
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Not Eligible</AlertTitle>
              <AlertDescription>
                Only the account with email "{SUPERADMIN_EMAIL}" can be initialized as SuperAdmin.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            onClick={initializeSuperAdmin} 
            disabled={!isSuperAdminEmail || isAdmin || isInitializing}
          >
            {isInitializing ? "Initializing..." : "Initialize SuperAdmin"}
          </Button>
        </CardFooter>
      </Card>
      
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Admin Panel Access</CardTitle>
            <CardDescription>
              You have SuperAdmin privileges. You can access the admin panel.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild>
              <Link href="/admin" className="flex items-center gap-2">
                Access Admin Panel
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
} 