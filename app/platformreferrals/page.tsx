"use client"

import { usePerchAuth } from "../../hooks/usePerchAuth"
import { useEffect, useState } from "react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Users, Link as LinkIcon, Trash2, DollarSign } from "lucide-react"

interface PlatformReferredUser {
  email: string
  name: string | null
  platformReferralEarnings: number
  createdAt: string
}

interface PlatformReferralLink {
  id: string
  code: string
  isActive: boolean
  createdAt: string
  platformReferredByEmail: string
  platformReferrals: Array<{
    platformReferredEmail: string
    platformReferredUser: PlatformReferredUser | null
  }>
}

interface PlatformReferralData {
  links: PlatformReferralLink[]
  totalPlatformReferralEarnings: number
  platformReferredEmails: string[]
}

export default function PlatformReferralsPage() {
  const { isLoaded, isSignedIn, clerkUser, localUser } = usePerchAuth()
  const [platformReferralData, setPlatformReferralData] = useState<PlatformReferralData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isSignedIn && localUser) {
      fetchPlatformReferralLinks()
    }
  }, [isSignedIn, localUser])

  async function fetchPlatformReferralLinks() {
    try {
      const response = await fetch('/api/platformreferrals')
      if (!response.ok) throw new Error('Failed to fetch platform referral links')
      const data = await response.json()
      setPlatformReferralData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load platform referral links')
    } finally {
      setIsLoading(false)
    }
  }

  async function createPlatformReferralLink() {
    try {
      if (platformReferralData?.links.filter(l => l.isActive).length >= 5) {
        setError('You can only have 5 active platform referral links')
        return
      }

      const response = await fetch('/api/platformreferrals', {
        method: 'POST'
      })
      if (!response.ok) throw new Error('Failed to create platform referral link')
      await fetchPlatformReferralLinks() // Refresh all data
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create platform referral link')
    }
  }

  async function deletePlatformReferralLink(id: string) {
    try {
      const response = await fetch(`/api/platformreferrals/${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete platform referral link')
      await fetchPlatformReferralLinks() // Refresh all data
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete platform referral link')
    }
  }

  function copyPlatformReferralLink(code: string) {
    const url = `${window.location.origin}/sign-up?platformReferralLinkId=${code}`
    navigator.clipboard.writeText(url)
  }

  if (!isLoaded || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Platform Referrals</h1>
          <p className="text-muted-foreground mt-2">
            Earn 5% of platform earnings from users you refer
          </p>
        </div>
        <Button onClick={createPlatformReferralLink} disabled={platformReferralData?.links.filter(l => l.isActive).length >= 5}>
          Create New Platform Referral Link
        </Button>
      </div>

      {error && (
        <Card className="mb-8 border-destructive">
          <CardContent className="pt-6 text-destructive">
            {error}
          </CardContent>
        </Card>
      )}

      {/* Overall Stats */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Overall Platform Referral Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Total Platform Referred Users: {platformReferralData?.platformReferredEmails.length || 0}</span>
            </div>
            <div className="flex items-center space-x-2">
              <LinkIcon className="h-4 w-4" />
              <span>Active Links: {platformReferralData?.links.filter(l => l.isActive).length || 0}/5</span>
            </div>
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4" />
              <span>Total Platform Referral Earnings: ${platformReferralData?.totalPlatformReferralEarnings.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        {platformReferralData?.links.map(link => (
          <Card key={link.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Platform Referral Link {link.isActive ? '(Active)' : '(Inactive)'}
              </CardTitle>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => deletePlatformReferralLink(link.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                  {`${window.location.origin}/sign-up?platformReferralLinkId=${link.code}`}
                </code>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => copyPlatformReferralLink(link.code)}
                >
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  {link.platformReferrals.length} platform referred users
                </div>
                <div>
                  Created: {new Date(link.createdAt).toLocaleDateString()}
                </div>
              </div>
              {link.platformReferrals.length > 0 && (
                <div className="mt-4 border-t pt-4">
                  <h4 className="text-sm font-medium mb-2">Platform Referred Users</h4>
                  <div className="space-y-2">
                    {link.platformReferrals.map(referral => (
                      referral.platformReferredUser && (
                        <div key={referral.platformReferredEmail} className="text-sm flex justify-between">
                          <span>{referral.platformReferredUser.name || referral.platformReferredEmail}</span>
                          <span>${referral.platformReferredUser.platformReferralEarnings.toFixed(2)}</span>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {(!platformReferralData?.links || platformReferralData.links.length === 0) && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-32">
              <p className="text-muted-foreground">No platform referral links yet</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={createPlatformReferralLink}
              >
                Create your first platform referral link
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
