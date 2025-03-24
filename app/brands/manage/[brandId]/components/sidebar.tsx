"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  LayoutDashboard,
  ShoppingBag,
  Users,
  Settings,
  PlusCircle,
  Palette,
  Link as LinkIcon,
  DollarSign,
  UserCog,
  Globe,
  MessageSquare,
  Bell
} from "lucide-react"

interface SidebarProps {
  brandId: string
}

const sidebarNavItems = [
  {
    title: "Overview",
    href: "/overview",
    icon: LayoutDashboard
  },
  {
    title: "Products",
    href: "/products",
    icon: ShoppingBag,
    children: [
      {
        title: "All Products",
        href: "/products"
      },
      {
        title: "Add Product",
        href: "/products/add"
      },
      {
        title: "Categories",
        href: "/products/categories"
      }
    ]
  },
  {
    title: "Affiliates",
    href: "/affiliates",
    icon: Users,
    children: [
      {
        title: "All Affiliates",
        href: "/affiliates"
      },
      {
        title: "Applications",
        href: "/affiliates/applications"
      },
      {
        title: "Commission Settings",
        href: "/affiliates/settings"
      }
    ]
  },
  {
    title: "Design",
    href: "/design",
    icon: Palette,
    children: [
      {
        title: "Theme",
        href: "/design/theme"
      },
      {
        title: "Layout",
        href: "/design/layout"
      },
      {
        title: "Branding",
        href: "/design/branding"
      }
    ]
  },
  {
    title: "Social Links",
    href: "/social",
    icon: LinkIcon
  },
  {
    title: "Pricing",
    href: "/pricing",
    icon: DollarSign
  },
  {
    title: "Team",
    href: "/team",
    icon: UserCog
  },
  {
    title: "SEO",
    href: "/seo",
    icon: Globe
  },
  {
    title: "Messages",
    href: "/messages",
    icon: MessageSquare
  },
  {
    title: "Notifications",
    href: "/notifications",
    icon: Bell
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings
  }
]

export function Sidebar({ brandId }: SidebarProps) {
  const pathname = usePathname()
  const baseUrl = `/brands/manage/${brandId}`

  return (
    <ScrollArea className="w-64 border-r h-[calc(100vh-7rem)]">
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="space-y-1">
            {sidebarNavItems.map((item) => (
              <div key={item.href}>
                <Button
                  asChild
                  variant={pathname === `${baseUrl}${item.href}` ? "secondary" : "ghost"}
                  className="w-full justify-start"
                >
                  <Link href={`${baseUrl}${item.href}`}>
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.title}
                  </Link>
                </Button>
                {item.children && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <Button
                        key={child.href}
                        asChild
                        variant={pathname === `${baseUrl}${child.href}` ? "secondary" : "ghost"}
                        className="w-full justify-start text-sm"
                      >
                        <Link href={`${baseUrl}${child.href}`}>
                          {child.title}
                        </Link>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </ScrollArea>
  )
} 