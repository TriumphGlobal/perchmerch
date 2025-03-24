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
import { Eye, EyeOff, AlertCircle, Gift, Check, X } from "lucide-react"
import Link from "next/link"
import { Checkbox } from "@/components/ui/checkbox"
import ReCAPTCHA from "react-google-recaptcha"

// Password requirements
const PASSWORD_REQUIREMENTS = [
  { id: "length", label: "At least 8 characters long", regex: /.{8,}/ },
  { id: "uppercase", label: "Contains uppercase letter", regex: /[A-Z]/ },
  { id: "lowercase", label: "Contains lowercase letter", regex: /[a-z]/ },
  { id: "number", label: "Contains number", regex: /[0-9]/ },
  { id: "special", label: "Contains special character", regex: /[!@#$%^&*(),.?":{}|<>]/ }
]

export default function SignUpPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isLoaded, signUp, setActive } = useSignUp()
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [referralCode, setReferralCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [pendingVerification, setPendingVerification] = useState(false)
  const [code, setCode] = useState("")
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [passwordRequirements, setPasswordRequirements] = useState<{[key: string]: boolean}>({})

  // Parse platformReferralLinkId from URL if present
  useEffect(() => {
    const linkId = searchParams.get("platformReferralLinkId")
    if (linkId) {
      setReferralCode(linkId)
    }
  }, [searchParams])

  // Check password requirements
  useEffect(() => {
    const requirements = PASSWORD_REQUIREMENTS.reduce((acc, requirement) => ({
      ...acc,
      [requirement.id]: requirement.regex.test(password)
    }), {})
    setPasswordRequirements(requirements)
  }, [password])

  // Check if all password requirements are met
  const allRequirementsMet = Object.values(passwordRequirements).every(Boolean)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded || !signUp) return

    // Validate form
    if (!allRequirementsMet) {
      toast({
        title: "Invalid password",
        description: "Please ensure your password meets all requirements",
        variant: "destructive",
      })
      return
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please ensure both passwords match",
        variant: "destructive",
      })
      return
    }

    if (!acceptedTerms) {
      toast({
        title: "Terms not accepted",
        description: "Please accept the terms and conditions to continue",
        variant: "destructive",
      })
      return
    }

    if (!captchaToken) {
      toast({
        title: "CAPTCHA required",
        description: "Please complete the CAPTCHA verification",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Start the sign-up process with Clerk
      const result = await signUp.create({
        emailAddress: email,
        password,
      })

      // Send email verification code
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" })

      setPendingVerification(true)
      toast({
        title: "Check your email",
        description: "We've sent you a verification code.",
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
    if (!isLoaded || !signUp) return

    setIsLoading(true)

    try {
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
                {/* Password requirements checklist */}
                <div className="space-y-2 text-sm">
                  {PASSWORD_REQUIREMENTS.map((req) => (
                    <div key={req.id} className="flex items-center gap-2">
                      {passwordRequirements[req.id] ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <X className="h-4 w-4 text-red-500" />
                      )}
                      <span className={passwordRequirements[req.id] ? "text-green-500" : "text-red-500"}>
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-sm text-red-500">Passwords do not match</p>
                )}
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

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="terms"
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                    required
                  />
                  <label
                    htmlFor="terms"
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I agree to the{" "}
                    <Link href="/terms" className="text-primary hover:underline" target="_blank">
                      Terms of Service
                    </Link>
                    {" "}and{" "}
                    <Link href="/privacy" className="text-primary hover:underline" target="_blank">
                      Privacy Policy
                    </Link>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <ReCAPTCHA
                  sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""}
                  onChange={(token: string | null) => setCaptchaToken(token)}
                />
              </div>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  After creating your account, you'll need to provide additional information for e-commerce.
                </AlertDescription>
              </Alert>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || !allRequirementsMet || !acceptedTerms || !captchaToken || password !== confirmPassword}
              >
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

