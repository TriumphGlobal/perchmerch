"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Store, ShoppingBag, Users, DollarSign } from "lucide-react"

export default function Home() {
  const { user } = useAuth()
  const router = useRouter()

  // If user is signed in, redirect to landing page
  useEffect(() => {
    if (user) {
      router.push("/landing")
    }
  }, [user, router])

  // If user is signed in, don't render anything while redirecting
  if (user) {
    return null
  }

  // If user is not signed in, show the landing page content
  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col gap-8">
        <section className="space-y-4">
          <h1 className="text-4xl font-bold">Welcome to PerchMerch</h1>
          <p className="text-xl text-muted-foreground">
            Your one-stop platform for creating and managing your merchandise stores.
          </p>
        </section>

        <section className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>Follow these steps to set up your merchandise store</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-muted">
                    <span className="text-sm font-bold">1</span>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium leading-none">Create a brand</p>
                    <p className="text-sm text-muted-foreground">
                      Set up your brand with a name, description, and logo.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-muted">
                    <span className="text-sm font-bold">2</span>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium leading-none">Add products</p>
                    <p className="text-sm text-muted-foreground">
                      Create products with descriptions, images, and pricing.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-muted">
                    <span className="text-sm font-bold">3</span>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium leading-none">Share your store</p>
                    <p className="text-sm text-muted-foreground">
                      Share your store link with customers and start selling.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-muted">
                    <span className="text-sm font-bold">4</span>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium leading-none">Create affiliate links</p>
                    <p className="text-sm text-muted-foreground">
                      Generate affiliate links to increase your sales through partners.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <div className="p-6 pt-0 flex gap-4 flex-wrap justify-center">
              <Link href="/signup">
                <Button>Create Account</Button>
              </Link>
              <Link href="/signup">
                <Button variant="outline">Create Your First Brand</Button>
              </Link>
              <Link href="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
            </div>
          </Card>
        </section>
      </div>
    </div>
  )
}

