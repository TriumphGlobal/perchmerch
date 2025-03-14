"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSignUp } from "@clerk/nextjs"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert"
import { toast } from "../../components/ui/use-toast"
import { Eye, EyeOff, AlertCircle, Gift } from "lucide-react"
import Link from "next/link"

export default function SignUpPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isLoaded, signUp, setActive } = useSignUp()
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [referralCode, setReferralCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [pendingVerification, setPendingVerification] = useState(false)
  const [code, setCode] = useState("")

  // Parse platformReferralLinkId from URL if present
  useEffect(() => {
    const linkId = searchParams.get("platformReferralLinkId")
    if (linkId) {
      setReferralCode(linkId)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded || isLoading) return

    try {
      setIsLoading(true)

      // Start the sign-up process
      await signUp.create({
        emailAddress: email,
        password,
      })

      // Send email verification code
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" })
      setPendingVerification(true)
      
      toast({
        title: "Verification email sent",
        description: "Please check your email for the verification code.",
      })

    } catch (error) {
      console.error("Sign-up error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded || isLoading) return

    try {
      setIsLoading(true)

      // Verify email code
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      })

      if (completeSignUp.status !== "complete") {
        throw new Error("Unable to verify email address")
      }

      // Set the user session active
      await setActive({ session: completeSignUp.createdSessionId })

      toast({
        title: "Email verified",
        description: "Creating your account...",
      })

      // Redirect to newaccount page with referral code if present
      const params = new URLSearchParams()
      if (referralCode) {
        params.set("platformReferralLinkId", referralCode)
      }
      router.push(`/newaccount${params.toString() ? `?${params.toString()}` : ""}`)

    } catch (error) {
      console.error("Verification error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to verify email",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!isLoaded) {
    return <div>Loading...</div>
  }

  return (
    <div className="container max-w-md py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Create your account</CardTitle>
          <CardDescription>
            Join PerchMerch and start selling your branded merchandise in minutes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!pendingVerification ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="referralCode" className="flex items-center gap-1">
                  <Gift className="h-4 w-4" />
                  Platform Referral Code {referralCode ? "(Auto-filled)" : "(Optional)"}
                </Label>
                <Input
                  id="referralCode"
                  placeholder="Enter a platform referral code if you have one"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  disabled={!!searchParams.get("platformReferralLinkId")}
                />
                {referralCode && (
                  <p className="text-sm text-muted-foreground">
                    You're being referred by another user. You'll both earn 5% commission on sales.
                  </p>
                )}
              </div>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  By signing up, you agree to our Terms of Service and Privacy Policy.
                  After creating your account, you'll need to provide additional information for e-commerce.
                </AlertDescription>
              </Alert>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
              
              <div className="text-center text-sm">
                Already have an account?{" "}
                <Link href="/sign-in" className="text-primary hover:underline">
                  Log in
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerification} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  placeholder="Enter verification code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Verifying..." : "Verify Email"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

