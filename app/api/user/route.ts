import { auth } from "@clerk/nextjs/server"
import { getCurrentUser } from "../../../lib/auth"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await auth()
    const userId = session.userId
    
    if (!userId) {
      return new NextResponse(null, { 
        status: 401,
        statusText: "Unauthorized - No Clerk session" 
      })
    }

    const user = await getCurrentUser()
    if (!user) {
      return new NextResponse(null, { 
        status: 404,
        statusText: "User not found in local database" 
      })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error in user API route:', error)
    return new NextResponse(null, { 
      status: 500,
      statusText: "Internal server error fetching user data" 
    })
  }
} 