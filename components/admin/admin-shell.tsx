"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { 
  LayoutDashboard, 
  Users, 
  ShoppingBag, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  BarChart3,
  DollarSign,
  Home
} from "lucide-react"

interface AdminShellProps {
  children: React.ReactNode
}

export function AdminShell({ children }: AdminShellProps) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])
  
  // Ensure user is admin
  if (!user?.isAdmin) {
    return <div className="p-8 text-center">Access denied. Admin privileges required.</div>
  }
  
  const navigation = [
    {
      name: "Dashboard",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
      current: pathname === "/admin/dashboard"
    },
    {
      name: "Users",
      href: "/admin/users",
      icon: Users,
      current: pathname === "/admin/users"
    },
    {
      name: "Brands",
      href: "/admin/brands",
      icon: ShoppingBag,
      current: pathname === "/admin/brands"
    },
    {
      name: "Analytics",
      href: "/admin/analytics",
      icon: BarChart3,
      current: pathname === "/admin/analytics"
    },
    {
      name: "Payments",
      href: "/admin/payments",
      icon: DollarSign,
      current: pathname === "/admin/payments"
    },
    {
      name: "Settings",
      href: "/admin/settings",
      icon: Settings,
      current: pathname === "/admin/settings"
    }
  ]
  
  return (
    <div className="min-h-screen bg-background">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 right-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>
      
      {/* Mobile sidebar */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-background border-r shadow-lg">
            <div className="flex flex-col h-full">
              <div className="p-4 border-b">
                <Link href="/" className="flex items-center gap-2">
                  <ShoppingBag className="h-6 w-6" />
                  <span className="font-bold text-xl">PerchMerch</span>
                </Link>
              </div>
              
              <div className="flex-1 py-4 overflow-y-auto">
                <nav className="px-2 space-y-1">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                        item.current
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                      {item.name}
                    </Link>
                  ))}
                </nav>
              </div>
              
              <div className="p-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{user.username}</p>
                    <p className="text-xs text-muted-foreground">Admin</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={logout}>
                    <LogOut className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col lg:border-r">
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <Link href="/" className="flex items-center gap-2">
              <ShoppingBag className="h-6 w-6" />
              <span className="font-bold text-xl">PerchMerch</span>
            </Link>
          </div>
          
          <div className="flex-1 py-4 overflow-y-auto">
            <nav className="px-2 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                    item.current
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          
          <div className="p-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{user.username}</p>
                <p className="text-xs text-muted-foreground">Admin</p>
              </div>
              <Button variant="ghost" size="icon" onClick={logout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="lg:pl-64">
        <div className="flex flex-col min-h-screen">
          <header className="sticky top-0 z-10 bg-background border-b">
            <div className="flex items-center justify-between h-16 px-4">
              <div className="flex items-center gap-2">
                <Link href="/" className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
                  <Home className="h-4 w-4" />
                  <span className="text-sm">Back to Home</span>
                </Link>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">Admin Dashboard</span>
              </div>
            </div>
          </header>
          
          <main className="flex-1">
            {children}
          </main>
          
          <footer className="border-t py-4 px-4 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} PerchMerch. All rights reserved.</p>
          </footer>
        </div>
      </div>
    </div>
  )
}

