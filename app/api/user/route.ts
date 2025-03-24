import { auth, currentUser } from "@clerk/nextjs/server"
import { getCurrentUser } from "../../../lib/auth"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log('User API route called')
    const [session, clerkUser] = await Promise.all([
      auth(),
      currentUser()
    ])
    
    if (!session?.userId) {
      console.log('No userId found in session')
      return new NextResponse(null, { 
        status: 401,
        statusText: "Unauthorized - No Clerk session" 
      })
    }

    if (!clerkUser?.emailAddresses?.[0]?.emailAddress) {
      console.log('No email found in Clerk user')
      return new NextResponse(null, {
        status: 400,
        statusText: "Bad Request - No email associated with user"
      })
    }

    console.log('Fetching user from database...')
    const user = await getCurrentUser()
    console.log('Database user result:', user)

    if (!user) {
      return new NextResponse(null, {
        status: 404,
        statusText: "Not Found - User not in database"
      })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error in user API route:', error)
    return new NextResponse(null, {
      status: 500,
      statusText: "Internal Server Error"
    })
  }
} 