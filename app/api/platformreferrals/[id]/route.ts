import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Get user's email from Clerk session
    const clerkUser = await auth().getUser(userId)
    const userEmail = clerkUser.emailAddresses[0]?.emailAddress

    if (!userEmail) {
      return new NextResponse("Email not found", { status: 400 })
    }

    // Verify the link belongs to the user
    const link = await db.platformReferralLink.findFirst({
      where: {
        id: params.id,
        email: userEmail
      }
    })

    if (!link) {
      return new NextResponse("Link not found", { status: 404 })
    }

    // Deactivate the link instead of deleting it to maintain referral history
    await db.platformReferralLink.update({
      where: {
        id: params.id
      },
      data: {
        isActive: false
      }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error in DELETE /api/platformreferrals/[id]:', error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
} 