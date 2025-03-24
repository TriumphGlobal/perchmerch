import { auth, currentUser } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function DebugAuthPage() {
  // 1. Get Clerk session multiple ways
  const session = await auth()
  const user = await currentUser()
  
  // Log all possible ways to get user info
  const clerkData = {
    // From session claims
    sessionEmail: session?.sessionClaims?.email,
    sessionRole: session?.sessionClaims?.metadata?.role,
    
    // From user object
    userEmail: user?.emailAddresses[0]?.emailAddress,
    userMetadata: user?.publicMetadata,
    privateMetadata: user?.privateMetadata,
    
    // Raw data for inspection
    rawSession: session,
    rawUser: {
      ...user,
      emailAddresses: user?.emailAddresses,
      primaryEmailAddress: user?.primaryEmailAddress,
    }
  }

  // 2. Get local DB user
  let dbUserDirect = null
  if (clerkData.userEmail) {
    try {
      dbUserDirect = await db.user.findUnique({
        where: { email: clerkData.userEmail },
        select: {
          email: true,
          role: true,
          createdAt: true
        }
      })
    } catch (error) {
      console.error('Error fetching user from database:', error)
    }
  }

  // 3. Get user through getCurrentUser
  const currentUserData = await getCurrentUser()

  // 4. If it's our target user, show detailed sync attempt
  const targetEmail = 'sales@triumphglobal.net'
  let syncAttempt = null
  
  if (clerkData.userEmail === targetEmail) {
    try {
      const result = await db.user.upsert({
        where: { email: targetEmail },
        update: { role: 'superAdmin' },
        create: {
          email: targetEmail,
          role: 'superAdmin',
          platformReferredEmails: [],
          brandIds: [],
          orderIds: [],
          affiliateLinks: [],
          platformReferralEarnings: 0
        }
      })
      syncAttempt = { success: true, result }
    } catch (error) {
      syncAttempt = { success: false, error: error.message }
    }
  }

  return (
    <div className="container py-8 space-y-6">
      <h1 className="text-3xl font-bold">Authentication Debug Page</h1>

      {/* Clerk Data */}
      <Card>
        <CardHeader>
          <CardTitle>Clerk Data (All Methods)</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg overflow-auto">
            {JSON.stringify(clerkData, null, 2)}
          </pre>
        </CardContent>
      </Card>

      {/* Direct DB User Data */}
      <Card>
        <CardHeader>
          <CardTitle>Direct Database User Data</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg overflow-auto">
            {JSON.stringify(dbUserDirect, null, 2)}
          </pre>
        </CardContent>
      </Card>

      {/* getCurrentUser Data */}
      <Card>
        <CardHeader>
          <CardTitle>getCurrentUser Data</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg overflow-auto">
            {JSON.stringify(currentUserData, null, 2)}
          </pre>
        </CardContent>
      </Card>

      {/* Sync Attempt (if applicable) */}
      {syncAttempt && (
        <Card>
          <CardHeader>
            <CardTitle>Sync Attempt</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-auto">
              {JSON.stringify(syncAttempt, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 