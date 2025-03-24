"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "../lib/utils"
import { Store, PlusCircle, LayoutDashboard, ShoppingBag, User, TrendingUp, Shield, Users, Loader2 } from "lucide-react"
import { Button } from "../components/ui/button"
import { usePerchAuth } from "../hooks/usePerchAuth"
import { useState } from "react"

export function MainNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { isLoaded, isSignedIn, isAdmin, isPlatformMod, clerkUser } = usePerchAuth()
  const [isNavigating, setIsNavigating] = useState(false)

  // Consider basic auth loaded when we have clerk user, even if metadata is still loading
  const isBasicAuthLoaded = clerkUser !== null || !isSignedIn
  
  // For admin features, we need full metadata loading
  const isAdminAuthLoaded = isLoaded

  // Handle protected route navigation
  const handleProtectedNavigation = (href: string, requiresAdmin = false, requiresPlatformMod = false) => {
    // For admin routes, wait for full metadata load
    if (requiresAdmin || requiresPlatformMod) {
      if (!isAdminAuthLoaded) {
        setIsNavigating(true)
        return
      }
    } else {
      // For regular user routes, only wait for basic auth
      if (!isBasicAuthLoaded) {
        setIsNavigating(true)
        return
      }
    }

    setIsNavigating(false)

    // Check access based on role requirements
    if (requiresAdmin && !isAdmin) {
      console.log('Access denied: Admin required')
      router.push('/')
      return
    }

    if (requiresPlatformMod && !isPlatformMod) {
      console.log('Access denied: Platform mod required')
      router.push('/')
      return
    }

    if (!isSignedIn) {
      console.log('Access denied: Sign in required')
      router.push('/sign-in')
      return
    }

    // All checks passed, navigate to the route
    router.push(href)
  }

  const routes = [
    {
      href: "/explore",
      label: "Explore Brands",
      active: pathname === "/explore",
      protected: false
    },
    // For regular user features, use isBasicAuthLoaded
    ...(isBasicAuthLoaded && isSignedIn ? [
      {
        href: "/account",
        label: "My Account",
        active: pathname === "/account",
        protected: true
      }
    ] : []),
    // For admin features, use isAdminAuthLoaded
    ...(isAdminAuthLoaded && isPlatformMod ? [
      {
        href: "/platform",
        label: "Platform Moderation",
        active: pathname === "/platform",
        protected: true,
        requiresPlatformMod: true
      }
    ] : []),
    ...(isAdminAuthLoaded && isAdmin ? [
      {
        href: "/superadmin",
        label: "Super Administration",
        active: pathname === "/superadmin",
        icon: Users,
        protected: true,
        requiresAdmin: true
      }
    ] : [])
  ]
    
  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex items-center space-x-6">
        <Link href="/" className="flex items-center space-x-2">
          <Store className="h-6 w-6" />
          <span className="font-bold text-xl">PerchMerch</span>
        </Link>

        <nav className="flex items-center space-x-6">
          {routes.map((route) => {
            // For protected routes, use a button that handles the navigation
            if (route.protected) {
              return (
                <button
                  key={route.href}
                  onClick={() => handleProtectedNavigation(
                    route.href, 
                    route.requiresAdmin, 
                    route.requiresPlatformMod
                  )}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary flex items-center gap-2",
                    route.active
                      ? "text-black dark:text-white"
                      : "text-muted-foreground"
                  )}
                  disabled={isNavigating}
                >
                  {route.icon && <route.icon className="h-4 w-4" />}
                  {route.label}
                  {isNavigating && <Loader2 className="h-3 w-3 animate-spin" />}
                </button>
              )
            }

            // For public routes, use regular Link
            return (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  route.active
                    ? "text-black dark:text-white"
                    : "text-muted-foreground"
                )}
              >
                <div className="flex items-center gap-2">
                  {route.icon && <route.icon className="h-4 w-4" />}
                  {route.label}
                </div>
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="flex items-center space-x-4">
        <Button
          className="text-sm flex items-center"
          asChild
          disabled={!isBasicAuthLoaded}
        >
          <Link href={isSignedIn ? "/brands/create" : "/sign-up"}>
            <PlusCircle className="mr-1 h-4 w-4" />
            Create Brand
          </Link>
        </Button>
      </div>
    </div>
  )
} 