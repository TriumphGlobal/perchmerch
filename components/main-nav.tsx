"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "../lib/utils"
import { Store, PlusCircle, LayoutDashboard, ShoppingBag, User, TrendingUp, Shield, Users } from "lucide-react"
import { Button } from "/components/ui/button"
import { useUser } from "@clerk/nextjs"

export function MainNav() {
  const pathname = usePathname()
  const { user } = useUser()

  // Compute auth states based on user data
  const isSignedIn = !!user
  const isSuperAdmin = user?.publicMetadata?.role === "superAdmin"
  const isPlatformAdmin = user?.publicMetadata?.role === "platformAdmin" || isSuperAdmin

  const routes = [
    {
      href: "/explore",
      label: "Explore Brands",
      active: pathname === "/explore",
    },
    ...(isSignedIn ? [
      {
        href: "/account",
        label: "My Account",
        active: pathname === "/account",
      }
    ] : []),
    ...(isPlatformAdmin ? [
      {
        href: "/platform",
        label: "Platform Moderation",
        active: pathname === "/platform",
      }
    ] : []),
    ...(isSuperAdmin ? [
      {
        href: "/superadmin",
        label: "Super Administration",
        active: pathname === "/superadmin",
        icon: Users
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
          {routes.map((route) => (
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
          ))}
        </nav>
      </div>

      <div className="flex items-center space-x-4">
        <Button
          className="text-sm flex items-center"
          asChild
        >
          <Link href={isSignedIn ? "/brands/create" : "/sign-up"}>
            <PlusCircle className="mr-1 h-4 w-4" />
            {isSignedIn ? "Create Brand" : "Create Brand"}
          </Link>
        </Button>
      </div>
    </div>
  )
} 