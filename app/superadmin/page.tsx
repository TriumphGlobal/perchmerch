"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { usePerchAuth } from "@/hooks/usePerchAuth"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserManagement } from "@/components/superadmin/user-management"
import { FinancialSettings } from "@/components/superadmin/financial-settings"
import { PlatformSettings } from "@/components/superadmin/platform-settings"
import { SystemAnalytics } from "@/components/superadmin/system-analytics"
import { DatabaseManagement } from "@/components/superadmin/database-management"
import { BrandsCommissions } from "@/components/superadmin/brands-commissions"

export default function SuperAdminDashboard() {
  const router = useRouter()
  const { isLoaded, isSignedIn, localUser } = usePerchAuth()

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in')
      return
    }

    if (isLoaded && localUser?.role !== 'superAdmin') {
      router.push('/')
      return
    }
  }, [isLoaded, isSignedIn, localUser?.role, router])

  if (!isLoaded) {
    return <div>Loading...</div>
  }

  if (localUser?.role !== 'superAdmin') {
    return <div>Access Denied</div>
  }

  return (
    <div className="container py-10">
      <h1 className="text-4xl font-bold mb-8">Super Administration</h1>
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="commissions">Brand Commissions</TabsTrigger>
          <TabsTrigger value="financial">Financial Settings</TabsTrigger>
          <TabsTrigger value="platform">Platform Settings</TabsTrigger>
          <TabsTrigger value="analytics">System Analytics</TabsTrigger>
          <TabsTrigger value="database">Database Management</TabsTrigger>
        </TabsList>
        <TabsContent value="users">
          <UserManagement />
        </TabsContent>
        <TabsContent value="commissions">
          <BrandsCommissions />
        </TabsContent>
        <TabsContent value="financial">
          <FinancialSettings />
        </TabsContent>
        <TabsContent value="platform">
          <PlatformSettings />
        </TabsContent>
        <TabsContent value="analytics">
          <SystemAnalytics />
        </TabsContent>
        <TabsContent value="database">
          <DatabaseManagement />
        </TabsContent>
      </Tabs>
    </div>
  )
} 