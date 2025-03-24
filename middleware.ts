import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

// Define public routes that don't require authentication
const publicRoutes = [
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
  "/explore",
  "/debug-auth",
  "/terms(.*)",
  "/privacy(.*)",
  "/sample",
  "/sample3(.*)",
  "/api/user",
  "/api/genres(.*)",
  "/api/brands(.*)",
  "/api/products(.*)",
  "/[brandId](.*)", // Only allow access to published brand pages
  "/orders(.*)" // Allow public order lookup
]

// Define public routes matcher
const isPublicRoute = createRouteMatcher(publicRoutes)

// Define protected routes that require authentication
const protectedRoutes = [
  "/platform(.*)",
  "/superadmin(.*)",
  "/account(.*)",
  "/brands/create(.*)", // Protect brand creation
  "/brands/manage(.*)", // Protect brand management routes
  "/app/brands/create(.*)", // Also protect app/brands paths
  "/app/brands/manage(.*)", // Also protect app/brands paths
  "/dashboard(.*)",
  "/platformreferrals(.*)",
  "/app/newaccount(.*)"
]

// Define protected routes matcher
const isProtectedRoute = createRouteMatcher(protectedRoutes)

export default clerkMiddleware(async (auth, req: NextRequest) => {
  // Allow public routes
  if (isPublicRoute(req)) {
    return NextResponse.next()
  }

  // For all other routes, ensure user is authenticated
  const { userId } = await auth()

  // Check if this is a protected route
  const isProtected = isProtectedRoute(req)

  if (!userId && isProtected) {
    const isApiRoute = req.url.includes("/api/")
    if (isApiRoute) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }
    const signInUrl = new URL("/sign-in", req.url)
    signInUrl.searchParams.set("redirect_url", req.url)
    return NextResponse.redirect(signInUrl)
  }

  // If user is authenticated or route doesn't require auth, allow access
  // Role checks will happen at the page level using usePerchAuth
  return NextResponse.next()
})

export const config = {
  matcher: [
    "/((?!.*\\.[\\w]+$|_next).*)",
    "/",
    "/(api|trpc)(.*)",
    "/brands/(.*)",
    "/app/brands/(.*)"
  ]
}
