import { SignInButton, SignUpButton, SignedIn, SignedOut } from "@clerk/nextjs"
import { auth, currentUser } from "@clerk/nextjs/server"
import { getCurrentUser } from "../../lib/auth"
import { Button } from "/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Users, Settings, Store, Database, Key } from "lucide-react"

export default async function SamplePage() {
  // Get data from both sources
  const [clerkSession, clerkUser, localUser] = await Promise.all([
    auth(),
    currentUser(),
    getCurrentUser()
  ])

  // Extract Clerk user data
  const clerkData = clerkUser ? {
    email: clerkUser.emailAddresses[0]?.emailAddress,
    firstName: clerkUser.firstName,
    role: clerkUser.publicMetadata?.role || 'user',
    isSignedIn: true,
  } : null

  return (
    <div className="min-h-screen">
      <SignedIn>
        <div className="container py-8 space-y-8">
          <h1 className="text-4xl font-bold">Account Status</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Clerk Account */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Clerk Account
                </CardTitle>
                <CardDescription>Authentication data from Clerk</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold">Email:</h3>
                    <p>{clerkData?.email || 'Not available'}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Name:</h3>
                    <p>{clerkData?.firstName || 'Not set'}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Role:</h3>
                    <p>{clerkData?.role || 'Not set'}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Status:</h3>
                    <p>{clerkData?.isSignedIn ? 'Signed In' : 'Signed Out'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Local DB Account */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Local Database
                </CardTitle>
                <CardDescription>User data from local database</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold">Email:</h3>
                    <p>{localUser?.email || 'Not found'}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Name:</h3>
                    <p>{localUser?.name || 'Not set'}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Role:</h3>
                    <p>{localUser?.role || 'Not set'}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Account Created:</h3>
                    <p>{localUser?.createdAt ? new Date(localUser.createdAt).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Role-based Features */}
          {localUser && (
            <Card>
              <CardHeader>
                <CardTitle>Available Features</CardTitle>
                <CardDescription>Based on role: {localUser.role}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* SuperAdmin Features */}
                  {localUser.role === 'superAdmin' && (
                    <>
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Platform Management
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p>Full platform access</p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            User Management
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p>Manage all users</p>
                        </CardContent>
                      </Card>
                    </>
                  )}

                  {/* PlatformAdmin Features */}
                  {(localUser.role === 'platformAdmin' || localUser.role === 'superAdmin') && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Settings className="h-5 w-5" />
                          Content Moderation
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p>Moderate content</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* User Stats */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Store className="h-5 w-5" />
                        Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p>Brands: {localUser.brands?.length || 0}</p>
                        <p>Orders: {localUser.orders?.length || 0}</p>
                        <p>Affiliate Links: {localUser.affiliateFor?.length || 0}</p>
                        <p>Earnings: ${localUser.platformReferralEarnings?.toFixed(2) || '0.00'}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </SignedIn>

      <SignedOut>
        <div className="container mx-auto py-20 text-center">
          <h1 className="text-4xl font-bold mb-6">Welcome to the Sample Page</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Sign in to see your account details from both systems.
          </p>
          <div className="flex gap-4 justify-center">
            <SignInButton mode="modal">
              <Button size="lg">Sign In</Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button size="lg" variant="outline">Create Account</Button>
            </SignUpButton>
          </div>
        </div>
      </SignedOut>
    </div>
  )
} 