"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"
import { Store, PlusCircle, LayoutDashboard, ShoppingBag, User } from "lucide-react"

export function MainNav() {
  const pathname = usePathname()
  const { user } = useAuth()
  
  // Check if we're on a brand page (path starts with a slug)
  // Now also considering /demo as a brand page
  const isBrandPage = pathname.match(/^\/[^/]+/) && 
                      !pathname.startsWith('/login') && !pathname.startsWith('/signup') && 
                      !pathname.startsWith('/account') && !pathname.startsWith('/admin') && 
                      !pathname.startsWith('/create-brand') && pathname !== '/landing'
  
  // If on a brand page and user is not signed in, only show the logo
  if (isBrandPage && !user) {
    return (
      <nav className="flex w-full">
        <div className="flex justify-between w-full">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="font-bold text-xl">PerchMerch</span>
            </Link>
          </div>
          
          {/* Empty center */}
          <div className="flex-1"></div>
          
          {/* Empty right */}
          <div className="w-[120px]"></div>
        </div>
      </nav>
    )
  }

  // Define navigation items
  const navItems = [
    // Show Demo Store only if not on a brand page or user is logged in
    {
      name: "Demo Store",
      href: "/demo",
      icon: <ShoppingBag className="h-4 w-4 mr-2" />,
      active: pathname === "/demo",
      show: !isBrandPage || !!user
    },
    // My Account for logged in users
    {
      name: "My Account",
      href: "/account",
      icon: <User className="h-4 w-4 mr-2" />,
      active: pathname.startsWith("/account"),
      show: !!user // Only show if logged in
    },
    // Create Brand for logged in users
    {
      name: "Create Brand",
      href: "/create-brand",
      icon: <PlusCircle className="h-4 w-4 mr-2" />,
      active: pathname === "/create-brand",
      show: !!user // Only show if logged in
    },
    // Admin for admin users only
    {
      name: "Admin",
      href: "/admin/dashboard",
      icon: <LayoutDashboard className="h-4 w-4 mr-2" />,
      active: pathname.startsWith("/admin"),
      show: user?.isAdmin // Only show for admin
    }
  ]

  // Filter items to show based on user state
  const visibleItems = navItems.filter(item => item.show)

  return (
    <nav className="flex w-full">
      <div className="flex justify-between w-full">
        {/* Logo */}
        <div className="flex items-center">
          <Link href={user ? "/landing" : "/"} className="flex items-center">
            <span className="font-bold text-xl">PerchMerch</span>
          </Link>
        </div>
        
        {/* Main navigation items - equally spaced */}
        <div className="flex items-center justify-center flex-1 px-8">
          <div className="flex items-center justify-between w-full max-w-2xl">
            {visibleItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center text-sm font-medium transition-colors hover:text-primary",
                  item.active ? "text-foreground" : "text-foreground/60"
                )}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </div>
        </div>
        
        {/* Empty space to balance the layout */}
        <div className="w-[120px]"></div>
      </div>
    </nav>
  )
} 