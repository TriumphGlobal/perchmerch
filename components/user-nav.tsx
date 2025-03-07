"use client"

import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import Link from "next/link"

export function UserNav() {
  const { user, logout } = useAuth()

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login">
          <Button variant="ghost" size="sm" className="text-xs">
            Sign In
          </Button>
        </Link>
        <Link href="/signup">
          <Button variant="outline" size="sm" className="text-xs">
            Sign Up
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground mr-2">
        Welcome, {user.username}
        {user.isAdmin && <span className="ml-1 text-blue-500">(Admin)</span>}
      </span>
      
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={logout}
        className="text-xs flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        <LogOut className="h-3.5 w-3.5" />
        <span>Logout</span>
      </Button>
    </div>
  )
}

