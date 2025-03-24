"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { toast } from "../../components/ui/use-toast"

export default function NewAccountPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isLoaded, user } = useUser()

  useEffect(() => {
    if (!isLoaded || !user) return

    const createLocalUser = async () => {
      try {
        const email = user.emailAddresses[0].emailAddress
        
        // Check if user already exists in local DB
        const checkResponse = await fetch(`/api/users/check?email=${encodeURIComponent(email)}`)
        const { exists } = await checkResponse.json()
        
        if (exists) {
          console.log("User already exists in local DB:", email)
          toast({
            title: "Welcome back",
            description: "You already have an account with us",
          })
          router.push("/")
          return
        }

        const platformReferralLinkId = searchParams.get("platformReferralLinkId")
        
        console.log("Creating local user for:", email)
        if (platformReferralLinkId) {
          console.log("With referral link:", platformReferralLinkId)
        }

        // Create local DB user
        const response = await fetch("/api/users/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            platformReferralLinkId: platformReferralLinkId || null
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Failed to create local user")
        }

        const newUser = await response.json()
        console.log("Local user created:", newUser)

        toast({
          title: "Success",
          description: platformReferralLinkId 
            ? "Account created successfully with referral link!"
            : "Account created successfully!",
        })

        // Redirect to account page
        router.push("/account")
      } catch (error) {
        console.error("Error creating local user:", error)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to create your account",
          variant: "destructive",
        })
      }
    }

    createLocalUser()
  }, [isLoaded, user, router, searchParams])

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-md mx-auto text-center">
        <h1 className="text-2xl font-bold mb-4">Creating Your Account</h1>
        <p className="text-muted-foreground mb-4">
          Please wait while we set up your account...
        </p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      </div>
    </div>
  )
}