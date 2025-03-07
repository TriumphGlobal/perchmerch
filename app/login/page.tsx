"use client"

import { useState } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"

export default function LoginPage() {
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    login(formData.username, formData.password)
  }

  return (
    <div className="container max-w-md mx-auto py-8">
      <div className="bg-card p-6 rounded-lg shadow-sm space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Sign In</h2>
          <p className="text-muted-foreground">
            Welcome back! Sign in to manage your account and brands
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              className="w-full p-2 border rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="w-full p-2 border rounded-md"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground p-2 rounded-md"
          >
            Sign In
          </button>
        </form>
        <div className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-primary hover:underline">
            Create one now
          </Link>
        </div>
      </div>
    </div>
  )
}

