import { type Metadata } from 'next'
import { ClerkProvider, SignOutButton, SignInButton, SignUpButton, SignedIn, SignedOut } from '@clerk/nextjs'
import { Inter } from 'next/font/google'
import { ThemeProvider } from "/components/theme-provider"
import { ClientLayout } from "/components/client-layout"
import { Toaster } from "/components/ui/toaster"
import { AuthProvider } from "/contexts/auth-context"
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: "PerchMerch - Create Your Own Merchandise Store",
  description: "Create your own merchandise store in minutes. Earn 50% commission on every sale. Create affiliate links for your brand."
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.variable} antialiased`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AuthProvider>
              <header className="flex justify-end items-center p-4 gap-4 h-16">
                <SignedOut>
                  <div className="flex gap-4">
                    <SignInButton mode="modal">
                      <button className="hover:text-gray-300">Sign in</button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <button className="hover:text-gray-300">Sign up</button>
                    </SignUpButton>
                  </div>
                </SignedOut>
                <SignedIn>
                  <SignOutButton>
                    <button className="hover:text-gray-300">Logout</button>
                  </SignOutButton>
                </SignedIn>
              </header>
              <ClientLayout>{children}</ClientLayout>
              <Toaster />
            </AuthProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}