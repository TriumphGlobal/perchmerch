import { auth, currentUser } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { getCurrentUser } from "../../../../lib/auth"

export async function GET() {
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

    // If no Clerk user, return unauthorized
    if (!clerkData?.email) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    // Return combined auth data
    return new NextResponse(
      JSON.stringify({
        clerkUser: clerkData,
        localUser,
        isSignedIn: true
      }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("Auth route error:", error)
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}

export async function POST() {
  return new NextResponse(
    JSON.stringify({ error: "Method not allowed" }),
    { status: 405, headers: { "Content-Type": "application/json" } }
  )
}