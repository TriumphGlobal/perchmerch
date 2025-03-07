"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, AlertCircle, CheckCircle2, AlertTriangle, Gift } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Captcha } from "@/components/captcha"

export default function SignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signup, user, validatePasswordStrength } = useAuth()
  
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [email, setEmail] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [referralCode, setReferralCode] = useState("")
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [marketingConsent, setMarketingConsent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState<{
    valid: boolean;
    message: string;
  }>({ valid: false, message: "" })
  
  // Parse referral code from URL if present
  useEffect(() => {
    const refCode = searchParams.get("ref");
    if (refCode) {
      setReferralCode(refCode);
    }
  }, [searchParams]);
  
  // Check if user is already logged in
  useEffect(() => {
    if (user) {
      router.push("/")
    }
  }, [user, router])
  
  // Validate password strength
  useEffect(() => {
    if (password) {
      const result = validatePasswordStrength(password);
      setPasswordStrength(result);
    } else {
      setPasswordStrength({ valid: false, message: "" });
    }
  }, [password, validatePasswordStrength]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isLoading) return
    
    // Basic form validation
    if (!username || !password || !confirmPassword || !email) {
      toast({
        title: "Error",
        description: "All fields are required",
        variant: "destructive",
      })
      return
    }
    
    // Check password match
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      })
      return
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      })
      return
    }
    
    // Check password strength
    if (!passwordStrength.valid) {
      toast({
        title: "Error",
        description: passwordStrength.message,
        variant: "destructive",
      })
      return
    }
    
    // Check captcha
    if (!captchaToken) {
      toast({
        title: "Error",
        description: "Please complete the captcha verification",
        variant: "destructive",
      })
      return
    }
    
    try {
    setIsLoading(true)
      await signup(username, password, email, referralCode, captchaToken)
      
      toast({
        title: "Success",
        description: "Your account has been created",
      })
      
      // Redirect to getting started page
      router.push("/create-brand")
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  const toggleShowPassword = () => {
    setShowPassword(!showPassword)
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Enter a username (4-20 characters)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={4}
                maxLength={20}
                pattern="^[a-zA-Z0-9_]+$"
                title="Username must be 4-20 characters and can only contain letters, numbers, and underscores"
              />
            </div>
            
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
                  onClick={toggleShowPassword}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {password && (
                <div className="text-sm mt-1">
                  {passwordStrength.valid ? (
                    <p className="text-green-500 flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" />
                      Strong password
                    </p>
                  ) : (
                    <p className="text-amber-500 flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" />
                      {passwordStrength.message}
                    </p>
                  )}
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-red-500 text-sm flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  Passwords do not match
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="referralCode" className="flex items-center gap-1">
                <Gift className="h-4 w-4" />
                Referral Code (Optional)
              </Label>
              <Input
                id="referralCode"
                placeholder="Enter a referral code if you have one"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
              />
              {referralCode && (
                <p className="text-sm text-muted-foreground">
                  You'll both earn 5% commission on sales
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label>Verify you're human</Label>
              <Captcha onVerify={(token) => setCaptchaToken(token)} />
                    </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="marketingConsent" 
                checked={marketingConsent}
                onCheckedChange={(checked: boolean | "indeterminate") => setMarketingConsent(checked as boolean)}
              />
              <label
                htmlFor="marketingConsent"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I agree to receive marketing emails (optional)
              </label>
            </div>
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Important</AlertTitle>
              <AlertDescription>
                By signing up, you agree to our Terms of Service and Privacy Policy.
                Your account will be used to manage your brands and payments.
              </AlertDescription>
            </Alert>
            
              <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            
            <div className="text-center text-sm">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Log in
              </Link>
            </div>
            </form>
        </CardContent>
      </Card>
    </div>
  )
}

