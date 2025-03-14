"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { SignIn } from "@clerk/nextjs"

export default function SignInPage() {
  const { user } = useUser()
  const router = useRouter()

  // Redirect authenticated users to the homepage
  useEffect(() => {
    if (!!user) {
      router.push("/")
    }
  }, [user, router])

  return (
    <div className="container max-w-md mx-auto py-8">
      <div className="bg-card p-6 rounded-lg shadow-sm space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Sign In</h2>
          <p className="text-muted-foreground">
            Welcome back! Sign in to manage your account and brands
          </p>
        </div>
        
        <SignIn 
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "shadow-none p-0",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
              socialButtonsBlockButton: "bg-white border border-gray-300 hover:bg-gray-50",
              socialButtonsBlockButtonText: "text-gray-700",
              formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90",
              footerActionLink: "text-primary hover:text-primary/90",
            }
          }}
          afterSignInUrl="/"
          signUpUrl="/sign-up"
        />

        <div className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="text-primary hover:underline">
            Create one now
          </Link>
        </div>
      </div>
    </div>
  )
}

