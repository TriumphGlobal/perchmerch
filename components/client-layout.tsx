"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { cn } from "../lib/utils"
import { MainNav } from "./main-nav"
import { SideNav } from "./side-nav"

interface ClientLayoutProps {
  children: React.ReactNode
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  
  // Determine if the current path should have a sidebar
  const shouldShowSidebar = () => {
    return pathname.includes('/manage') || 
           pathname.includes('/admin') || 
           pathname.includes('/account')
  }
  
  const hasSidebar = shouldShowSidebar()
  
  // Reset sidebar state when navigating between pages with/without sidebar
  useEffect(() => {
    setSidebarOpen(true)
  }, [hasSidebar])

  return (
    <div className="flex flex-col min-h-screen">
      {/* Main navigation */}
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <MainNav />
        </div>
      </div>
      
      {/* Main content with optional sidebar */}
      <div className="flex flex-1">
        {/* Sidebar (conditionally rendered) */}
        {hasSidebar && <SideNav />}
        
        {/* Main content area */}
        <main className={cn(
          "flex-1 p-6",
          hasSidebar && "transition-all duration-300"
        )}>
          {children}
        </main>
      </div>
    </div>
  )
} 