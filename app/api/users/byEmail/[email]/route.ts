import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: { email: string } }
) {
  try {
    const session = await auth()
    if (!session.userId) {
      return new NextResponse(null, { 
        status: 401,
        statusText: "Unauthorized" 
      })
    }

    const user = await db.user.findUnique({
      where: { email: decodeURIComponent(params.email) }
    })

    if (!user) {
      return new NextResponse(null, { 
        status: 404,
        statusText: "User not found" 
      })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error in users/byEmail API route:', error)
    return new NextResponse(null, { 
      status: 500,
      statusText: "Internal server error" 
    })
  }
} 