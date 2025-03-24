import { auth } from "@clerk/nextjs/server"
import { currentUser } from "@clerk/nextjs/server"
import { getCurrentUser } from "../lib/auth"
import { redirect } from "next/navigation"
import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Shield, Users, Settings, Store, Database, Key, Globe, DollarSign, ShoppingBag, ArrowRight, UserPlus, AlertTriangle } from "lucide-react"
import Link from "next/link"

export default async function Home() {
  try {
    // Get data from both sources
    const [clerkSession, clerkUser, localUser] = await Promise.all([
      auth(),
      currentUser(),
      getCurrentUser()
    ])

    // Extract Clerk user data
    const clerkData = clerkUser ? {
      email: clerkUser.emailAddresses[0]?.emailAddress || null,
      firstName: clerkUser.firstName,
      role: clerkUser.publicMetadata?.role as string || 'user',
      isSignedIn: true,
    } : null
    const isAdmin = localUser?.role === "superAdmin"
    const isPlatformMod = localUser?.role === "platformAdmin" || isAdmin
    return (
      <div className="min-h-screen">
        {clerkData ? (
           <div className="min-h-screen">
           <SignedIn>
             <div className="container py-8 space-y-8">
               <h1 className="text-4xl font-bold">Welcome to Your Dashboard</h1>
               
               {/* Account Status */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
                     </div>
                   </CardContent>
                 </Card>
               </div>
     
               {/* Quick Actions */}
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {/* SuperAdmin-only Actions */}
                 {isAdmin && (
                   <>
                     <Card>
                       <CardHeader>
                         <CardTitle className="flex items-center gap-2">
                           <Shield className="h-5 w-5" />
                           Financial Management
                         </CardTitle>
                         <CardDescription>Manage platform finances and commissions</CardDescription>
                       </CardHeader>
                       <CardContent>
                         <Button asChild className="w-full">
                           <Link href="/superadmin?tab=financial">Financial Settings</Link>
                         </Button>
                       </CardContent>
                     </Card>
     
                     <Card>
                       <CardHeader>
                         <CardTitle className="flex items-center gap-2">
                           <Users className="h-5 w-5" />
                           User Management
                         </CardTitle>
                         <CardDescription>Manage roles and permanent bans</CardDescription>
                       </CardHeader>
                       <CardContent>
                         <Button asChild className="w-full">
                           <Link href="/superadmin?tab=users">Manage Users</Link>
                         </Button>
                       </CardContent>
                     </Card>
     
                     <Card>
                       <CardHeader>
                         <CardTitle className="flex items-center gap-2">
                           <Settings className="h-5 w-5" />
                           Platform Settings
                         </CardTitle>
                         <CardDescription>Configure system settings and API keys</CardDescription>
                       </CardHeader>
                       <CardContent>
                         <Button asChild className="w-full">
                           <Link href="/superadmin?tab=platform">Platform Settings</Link>
                         </Button>
                       </CardContent>
                     </Card>
                   </>
                 )}
     
                 {/* PlatformAdmin Actions */}
                 {isPlatformMod && (
                   <>
                     <Card>
                       <CardHeader>
                         <CardTitle className="flex items-center gap-2">
                           <Shield className="h-5 w-5" />
                           Product Moderation
                         </CardTitle>
                         <CardDescription>Review and moderate products</CardDescription>
                       </CardHeader>
                       <CardContent>
                         <Button asChild className="w-full">
                           <Link href="/platform?tab=moderation">Product Moderation</Link>
                         </Button>
                       </CardContent>
                     </Card>

                     <Card>
                       <CardHeader>
                         <CardTitle className="flex items-center gap-2">
                           <Store className="h-5 w-5" />
                           Brand Approvals
                         </CardTitle>
                         <CardDescription>Review and approve new brands</CardDescription>
                       </CardHeader>
                       <CardContent>
                         <Button asChild className="w-full">
                           <Link href="/platform?tab=brands">Brand Approvals</Link>
                         </Button>
                       </CardContent>
                     </Card>

                     <Card>
                       <CardHeader>
                         <CardTitle className="flex items-center gap-2">
                           <AlertTriangle className="h-5 w-5" />
                           Reports
                         </CardTitle>
                         <CardDescription>Handle user reports and content flags</CardDescription>
                       </CardHeader>
                       <CardContent>
                         <Button asChild className="w-full">
                           <Link href="/platform?tab=reports">Reports</Link>
                         </Button>
                       </CardContent>
                     </Card>
                   </>
                 )}
     
                 {/* Regular User Actions */}
                 <Card>
                   <CardHeader>
                     <CardTitle className="flex items-center gap-2">
                       <Store className="h-5 w-5" />
                       Explore Brands
                     </CardTitle>
                     <CardDescription>Discover and shop from various brands</CardDescription>
                   </CardHeader>
                   <CardContent>
                     <Button asChild className="w-full">
                       <Link href="/brands">Browse Brands</Link>
                     </Button>
                   </CardContent>
                 </Card>
     
                 <Card>
                   <CardHeader>
                     <CardTitle className="flex items-center gap-2">
                       <Store className="h-5 w-5" />
                       Create a Brand
                     </CardTitle>
                     <CardDescription>Start selling your own merchandise</CardDescription>
                   </CardHeader>
                   <CardContent>
                     <Button asChild className="w-full">
                       <Link href="/brands/create">Create Brand</Link>
                     </Button>
                   </CardContent>
                 </Card>
     
                 <Card>
                   <CardHeader>
                     <CardTitle className="flex items-center gap-2">
                       <UserPlus className="h-5 w-5" />
                       Referral Program
                     </CardTitle>
                     <CardDescription>Invite others and earn commission</CardDescription>
                   </CardHeader>
                   <CardContent>
                     <Button asChild className="w-full">
                       <Link href="/platformreferrals">View Referrals</Link>
                     </Button>
                   </CardContent>
                 </Card>
               </div>
             </div>
           </SignedIn>
         </div>
        ) : (
          <SignedOut>
            {/* Hero Section */}
            <section className="container mx-auto py-20 px-4 text-center">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Turn Your Art into Profit
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Create your own brand and merchandise store in minutes. No inventory, no risk, pure creativity.
              </p>
              <div className="flex gap-4 justify-center">
                <SignInButton mode="modal">
                  <Button size="lg" className="text-lg">
                    Sign in to manage your account <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </SignInButton>
                <Button size="lg" className="text-lg" asChild>
                  <Link href="/sign-up">
                    Start Your Brand Today <ArrowRight className="h-5 w-5 ml-2" />
                  </Link>
                </Button>
              </div>
            </section>

            {/* Public Actions */}
            <section className="container mx-auto py-20">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                <Card className="h-full">
                  <div className="p-6 flex flex-col h-full">
                    <div className="flex items-center gap-2 font-semibold text-lg mb-2">
                      <Globe className="h-5 w-5" />
                      Explore Brands
                    </div>
                    <p className="text-muted-foreground mb-4 flex-grow">
                      Discover unique creator brands
                    </p>
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/explore">Browse Brands</Link>
                    </Button>
                  </div>
                </Card>

                <Card className="h-full">
                  <div className="p-6 flex flex-col h-full">
                    <div className="flex items-center gap-2 font-semibold text-lg mb-2">
                      <Store className="h-5 w-5" />
                      Start Selling
                    </div>
                    <p className="text-muted-foreground mb-4 flex-grow">
                      Checkout quicker, create your own merchandise store, or affiliate market to start earning today!
                    </p>
                    <Button className="w-full" asChild>
                      <Link href="/sign-up">Create Account</Link>
                    </Button>
                  </div>
                </Card>
              </div>
            </section>
          </SignedOut>
        )}
      </div>
    )
  } catch (error) {
    console.error("Error in Home page:", error);
    redirect("/sign-in");
  }
}

