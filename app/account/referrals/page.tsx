"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { 
  Copy, 
  Users, 
  DollarSign, 
  Share2, 
  Link as LinkIcon,
  Twitter,
  Facebook,
  Mail
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function ReferralsPage() {
  const router = useRouter()
  const { user, generateReferralCode, getReferralStats } = useAuth()
  
  const [referralCode, setReferralCode] = useState<string>("")
  const [referralLink, setReferralLink] = useState<string>("")
  const [referralStats, setReferralStats] = useState<{ referrals: number, earnings: number }>({ referrals: 0, earnings: 0 })
  const [isLoading, setIsLoading] = useState(true)
  
  // Mock referral data
  const [referrals, setReferrals] = useState([
    {
      id: "1",
      username: "user1",
      joinDate: "2024-03-01",
      status: "active",
      sales: 12,
      earnings: 45.75
    },
    {
      id: "2",
      username: "user2",
      joinDate: "2024-03-05",
      status: "active",
      sales: 8,
      earnings: 32.20
    },
    {
      id: "3",
      username: "user3",
      joinDate: "2024-03-10",
      status: "pending",
      sales: 0,
      earnings: 0
    }
  ])
  
  // Check if user is logged in
  useEffect(() => {
    if (!user) {
      router.push("/login?redirect=/account/referrals")
      return
    }
    
    // Get or generate referral code
    if (!user.referralCode) {
      try {
        const code = generateReferralCode(user.id)
        setReferralCode(code)
      } catch (error) {
        console.error("Error generating referral code:", error)
        toast({
          title: "Error",
          description: "Failed to generate referral code",
          variant: "destructive"
        })
      }
    } else {
      setReferralCode(user.referralCode)
    }
    
    // Get referral stats
    try {
      const stats = getReferralStats(user.id)
      setReferralStats(stats)
    } catch (error) {
      console.error("Error getting referral stats:", error)
    }
    
    setIsLoading(false)
  }, [user, router, generateReferralCode, getReferralStats])
  
  // Update referral link when code changes
  useEffect(() => {
    if (referralCode && typeof window !== "undefined") {
      const baseUrl = window.location.origin
      setReferralLink(`${baseUrl}/signup?ref=${referralCode}`)
    }
  }, [referralCode])
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink)
    toast({
      title: "Link Copied",
      description: "Referral link copied to clipboard"
    })
  }
  
  const handleShareTwitter = () => {
    const text = "Join me on PerchMerch and start selling your branded merchandise in minutes!"
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralLink)}`
    window.open(url, "_blank")
  }
  
  const handleShareFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`
    window.open(url, "_blank")
  }
  
  const handleShareEmail = () => {
    const subject = "Join me on PerchMerch"
    const body = `Hey,\n\nI'm using PerchMerch to sell branded merchandise without any hassle. You should check it out!\n\nUse my referral link to sign up and we'll both earn 5% commission on sales:\n\n${referralLink}\n\nCheers!`
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.open(url)
  }
  
  if (isLoading) {
    return <div className="container max-w-4xl py-10">Loading...</div>
  }
  
  if (!user) {
    return null
  }
  
  return (
    <div className="container max-w-4xl py-10">
      <h1 className="text-3xl font-bold mb-6">Referral Program</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Referrals</p>
                <p className="text-2xl font-bold">{referralStats.referrals}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <p className="text-2xl font-bold">${referralStats.earnings.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Share2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Commission Rate</p>
                <p className="text-2xl font-bold">5%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Your Referral Link</CardTitle>
          <CardDescription>
            Share this link with friends and earn 5% commission on their sales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={referralLink}
                readOnly
                className="pl-10"
              />
            </div>
            <Button onClick={handleCopyLink}>
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleShareTwitter}>
              <Twitter className="mr-2 h-4 w-4" />
              Twitter
            </Button>
            <Button variant="outline" onClick={handleShareFacebook}>
              <Facebook className="mr-2 h-4 w-4" />
              Facebook
            </Button>
            <Button variant="outline" onClick={handleShareEmail}>
              <Mail className="mr-2 h-4 w-4" />
              Email
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Your Referrals</CardTitle>
          <CardDescription>
            Track the performance of your referrals
          </CardDescription>
        </CardHeader>
        <CardContent>
          {referrals.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sales</TableHead>
                  <TableHead className="text-right">Your Earnings</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referrals.map((referral) => (
                  <TableRow key={referral.id}>
                    <TableCell className="font-medium">{referral.username}</TableCell>
                    <TableCell>{new Date(referral.joinDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        referral.status === "active" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {referral.status === "active" ? "Active" : "Pending"}
                      </span>
                    </TableCell>
                    <TableCell>{referral.sales}</TableCell>
                    <TableCell className="text-right">${referral.earnings.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>You haven't referred anyone yet.</p>
              <p className="mt-2">Share your referral link to start earning!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 