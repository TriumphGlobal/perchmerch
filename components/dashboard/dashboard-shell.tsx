import type React from "react"
import { UserNav } from "@/components/user-nav"
import Link from "next/link"

interface DashboardShellProps {
  children: React.ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl">
            <Link href="/">
              <span className="text-primary">Perch</span>Merch
            </Link>
          </div>
          <UserNav />
        </div>
      </header>
      <main className="flex-1 container py-6 space-y-8">{children}</main>
    </div>
  )
}

