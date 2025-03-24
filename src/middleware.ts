import { clerkMiddleware } from "@clerk/nextjs/server"

// This example protects all routes including api/trpc routes
// Please edit this to allow other routes to be public as needed.
// See https://clerk.com/docs/references/nextjs/auth-middleware for more information about configuring your middleware
const publicRoutes = [
  "/",
  "/sign-in",
  "/sign-up",
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

export default clerkMiddleware()

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
}
