import { clerkMiddleware, auth, currentUser } from "@clerk/nextjs/server"
import { getCurrentUser } from "./lib/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { checkBrandOwnership } from "./lib/auth-check"


async function authenticatedMiddleware(auth: any, req: NextRequest) {
  try {
    // Get data from both sources
    const [clerkSession, clerkUser, localUser] = await Promise.all([
      auth(),
      currentUser(),
      getCurrentUser()
    ])

    // Extract Clerk user data
    const clerkData = clerkUser ? {
      email: clerkUser.emailAddresses[0]?.emailAddress || null,
      role: clerkUser.publicMetadata?.role as string || 'user',
      isSignedIn: true,
    } : null

    // Public routes that don't require authentication
    const publicRoutes = [
      "/",
      "/sign-in*",
      "/sign-up*",
      "/api/webhooks*",
      "/explore",
      "/debug-auth",
      "/terms*",
      "/privacy*",
      "/admin-access",
      "/brands/[brandId]",
      "/brands/[brandId]/cart*",
      "/brands/[brandId]/checkout*",
      "/brands/[brandId]/products*",
      "/sample",
      "/sample3*"
    ]

    // platform routes that require platform or superAdmin role
    const platformAdminRoutes = [
      "/platform*",
      "/api/platform*"
    ]

    // Admin routes that require superAdmin role
    const superAdminRoutes = [
      "/platform*",
      "/api/platform*",
      "/superadmin*",
      "/api/superadmin*"
    ]

    // Brand management routes that require authentication and ownership
    const brandManageRoutes = [
      "/brands/[brandId]/manage*"
    ]

    const isPublic = (path: string) => {
      return publicRoutes.find(x => 
        path.match(new RegExp(`^${x}$`.replace('*$', '($|/)')))
      )
    }

    // If the user is not signed in and the route is not public, redirect them to sign in
    if (!clerkData?.email) {
      const signInUrl = new URL('/sign-in', req.url)
      signInUrl.searchParams.set('redirect_url', req.url)
      return NextResponse.redirect(signInUrl)
    }

    // Check if accessing superadmin route
    const isSuperAdminRoute = superAdminRoutes.some(pattern => {
      if (pattern.endsWith("*")) {
        return req.nextUrl.pathname.startsWith(pattern.slice(0, -1))
      }
      return req.nextUrl.pathname === pattern
    })

    if (isSuperAdminRoute && clerkData.role !== "superAdmin") {
      return new NextResponse("Unauthorized", { status: 403 })
    }

    // Check if accessing platform admin route
    const isPlatformAdminRoute = platformAdminRoutes.some(pattern => {
      if (pattern.endsWith("*")) {
        return req.nextUrl.pathname.startsWith(pattern.slice(0, -1))
      }
      return req.nextUrl.pathname === pattern
    })

    if (isPlatformAdminRoute && clerkData.role !== "platformAdmin" && clerkData.role !== "superAdmin") {
      return new NextResponse("Unauthorized", { status: 403 })
    }

    // Check if accessing brand management route
    const brandManageMatch = req.nextUrl.pathname.match(/^\/brands\/([^\/]+)\/manage/)
    if (brandManageMatch) {
      const brandId = brandManageMatch[1]
      // Check if user owns this brand
      const hasAccess = await checkBrandOwnership(clerkData.email, brandId)
      
      if (!hasAccess) {
        return new NextResponse("Unauthorized - You don't have access to manage this brand", { 
          status: 403 
        })
      }
    }

    return NextResponse.next()
  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.next()
  }
}

export default clerkMiddleware((auth, req) => authenticatedMiddleware(auth, req))

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"]
}
