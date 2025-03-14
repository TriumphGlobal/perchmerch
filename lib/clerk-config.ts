/**
 * This file contains the core configuration for Clerk authentication.
 * Any changes to authentication setup should be made here.
 * DO NOT modify the middleware implementation directly.
 */

export const CLERK_CONFIG = {
  // Public routes that don't require authentication
  publicRoutes: [
    "/",
    "/brands/[brandId]",
    "/cart(.*)",
    "/checkout(.*)",
    "/sign-up",
    "/sign-in",
    "/explore",
    "/api/users/check",
    "/api/init-superadmin"
  ],

  // Routes that can be accessed without authentication
  ignoredRoutes: [
    "/api/webhooks(.*)",
    "/api/uploadthing"
  ],

  // Protected routes that require authentication
  protectedRoutes: [
    "/brands/create",
    "/account(.*)",
    "/dashboard(.*)",
    "/api/brands(.*)",
    "/api/products(.*)"
  ],

  // Debug mode for development
  debug: true,

  // URL configuration
  signInUrl: "/sign-in",
  signUpUrl: "/sign-up",
  afterSignInUrl: "/",
  afterSignUpUrl: "/"
} 