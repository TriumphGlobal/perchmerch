"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { 
  ChevronLeft, 
  ChevronRight,
  LayoutDashboard,
  Users,
  Settings,
  ShoppingBag,
  Store,
  LineChart,
  DollarSign,
  UserPlus,
  User,
  Link as LinkIcon,
  Package,
  FileText
} from "lucide-react"

export function SideNav() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  // Define navigation sections based on path
  const getNavItems = () => {
    // Brand management navigation
    if (pathname.includes('/manage')) {
      const brandSlug = pathname.split('/')[1]
      return [
        {
          name: "Dashboard",
          href: `/${brandSlug}/manage`,
          icon: <LayoutDashboard className="h-5 w-5" />,
          active: pathname === `/${brandSlug}/manage` || pathname === `/${brandSlug}/manage?tab=dashboard`
        },
        {
          name: "Products",
          href: `/${brandSlug}/manage?tab=products`,
          icon: <ShoppingBag className="h-5 w-5" />,
          active: pathname.includes(`?tab=products`)
        },
        {
          name: "Orders",
          href: `/${brandSlug}/manage?tab=orders`,
          icon: <Package className="h-5 w-5" />,
          active: pathname.includes(`?tab=orders`)
        },
        {
          name: "Affiliate Links",
          href: `/${brandSlug}/manage?tab=affiliates`,
          icon: <LinkIcon className="h-5 w-5" />,
          active: pathname.includes(`?tab=affiliates`)
        },
        {
          name: "Analytics",
          href: `/${brandSlug}/manage?tab=analytics`,
          icon: <LineChart className="h-5 w-5" />,
          active: pathname.includes(`?tab=analytics`)
        },
        {
          name: "Brand Details",
          href: `/${brandSlug}/manage?tab=brand`,
          icon: <Store className="h-5 w-5" />,
          active: pathname.includes(`?tab=brand`)
        },
        {
          name: "Settings",
          href: `/${brandSlug}/manage?tab=settings`,
          icon: <Settings className="h-5 w-5" />,
          active: pathname.includes(`?tab=settings`)
        }
      ]
    }
    
    // Admin dashboard navigation
    if (pathname.includes('/admin')) {
      return [
        {
          name: "Dashboard",
          href: "/admin/dashboard",
          icon: <LayoutDashboard className="h-5 w-5" />,
          active: pathname === "/admin/dashboard"
        },
        {
          name: "Users",
          href: "/admin/users",
          icon: <Users className="h-5 w-5" />,
          active: pathname === "/admin/users"
        },
        {
          name: "Brands",
          href: "/admin/brands",
          icon: <Store className="h-5 w-5" />,
          active: pathname === "/admin/brands"
        },
        {
          name: "Revenue",
          href: "/admin/revenue",
          icon: <DollarSign className="h-5 w-5" />,
          active: pathname === "/admin/revenue"
        },
        {
          name: "Settings",
          href: "/admin/settings",
          icon: <Settings className="h-5 w-5" />,
          active: pathname === "/admin/settings"
        }
      ]
    }
    
    // User account navigation
    if (pathname.includes('/account')) {
      return [
        {
          name: "Personal Information",
          href: "/account",
          icon: <User className="h-5 w-5" />,
          active: pathname === "/account"
        },
        {
          name: "My Brands",
          href: "/account/brands",
          icon: <Store className="h-5 w-5" />,
          active: pathname === "/account/brands"
        },
        {
          name: "My Purchases",
          href: "/account/purchases",
          icon: <ShoppingBag className="h-5 w-5" />,
          active: pathname === "/account/purchases"
        },
        {
          name: "Settings",
          href: "/account/settings",
          icon: <Settings className="h-5 w-5" />,
          active: pathname === "/account/settings"
        }
      ]
    }
    
    // Default: return empty array if no matching section
    return []
  }

  const navItems = getNavItems()
  
  // If no navigation items for this section, don't render the sidebar
  if (navItems.length === 0) {
    return null
  }

  return (
    <div className={cn(
      "h-full border-r bg-background transition-all duration-300",
      collapsed ? "w-[60px]" : "w-[240px]"
    )}>
      <div className="flex flex-col h-full">
        {/* Navigation items */}
        <div className="flex-1 py-4">
          <div className="px-3 py-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground mb-1",
                  item.active ? "bg-accent text-accent-foreground" : "transparent"
                )}
              >
                <span className="mr-3">{item.icon}</span>
                {!collapsed && <span>{item.name}</span>}
              </Link>
            ))}
          </div>
        </div>
        
        {/* Collapse/Expand button */}
        <div className="p-3 border-t">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-center"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            {!collapsed && <span className="ml-2">Collapse</span>}
          </Button>
        </div>
      </div>
    </div>
  )
} 