"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { toast } from "../../components/ui/use-toast"

export default function NewAccountPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isLoaded, user } = useUser()
  const [isCreating, setIsCreating] = useState(false)
  
  useEffect(() => {
    const createLocalUser = async () => {
      // If Clerk hasn't loaded yet or we're already creating, wait
      if (!isLoaded || isCreating) return
      
      // If no user is signed in, redirect to sign-up
      if (!user) {
        toast({
          title: "Error",
          description: "Please sign up first",
          variant: "destructive",
        })
        router.push("/sign-up")
        return
      }

      try {
        setIsCreating(true)
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

        // Always redirect to /account after successful creation
        router.push("/account")
      } catch (error) {
        console.error("Error creating local user:", error)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to create your account",
          variant: "destructive",
        })
      } finally {
        setIsCreating(false)
      }
    }

    createLocalUser()
  }, [isLoaded, user, router, searchParams])

  if (!isLoaded) {
    return (
      <div className="container flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="container flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Setting up your account...</h1>
        <p className="text-muted-foreground">
          {isCreating 
            ? "Please wait while we finish creating your account."
            : "Redirecting you to your account page..."}
        </p>
      </div>
    </div>
  )
}