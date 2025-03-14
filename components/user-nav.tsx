"use client"

import { useAuth } from "../contexts/auth-context"
import { Button } from "./ui/button"
import { LogOut } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export function UserNav() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleSignUp = (e: React.MouseEvent) => {
    e.preventDefault()
    router.push("/sign-up")
  }

  const handleSignIn = (e: React.MouseEvent) => {
    e.preventDefault()
    router.push("/sign-in")
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs"
          onClick={handleSignIn}
        >
          Log In
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="text-xs"
          onClick={handleSignUp}
        >
          Sign Up
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground mr-2">
        Welcome, {user.username}
        {user.isAdmin && <span className="ml-1 text-blue-500">(Admin)</span>}
      </span>
      <Link href="/">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={logout}
          className="text-xs flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Logout</span>
        </Button>
      </Link>
    </div>
  )
}

