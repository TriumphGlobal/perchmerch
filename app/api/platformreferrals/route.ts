import { auth, currentUser } from "@clerk/nextjs/server"
import { db } from "../../../lib/db"
import { NextResponse } from "next/server"
import { generateUniqueCode } from "../../../lib/utils"

export async function GET() {
  try {
    const [session, clerkUser] = await Promise.all([
      auth(),
      currentUser()
    ])

    if (!clerkUser) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const userEmail = clerkUser.emailAddresses[0]?.emailAddress
    if (!userEmail) {
      return new NextResponse("Email not found", { status: 400 })
    }

    // Verify user exists in local DB
    const localUser = await db.user.findUnique({
      where: { email: userEmail }
    })

    if (!localUser) {
      return new NextResponse("User not found in local database", { status: 404 })
    }

    // Get user's referral links with their referrals and referred user details
    const links = await db.platformReferralLink.findMany({
      where: {
        email: userEmail
      },
      include: {
        platformReferrals: {
          include: {
            platformReferredUser: {
              select: {
                email: true,
                name: true,
                platformReferralEarnings: true,
                createdAt: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculate total earnings from all referrals
    const totalEarnings = localUser.platformReferralEarnings || 0

    return NextResponse.json({
      links,
      totalPlatformReferralEarnings: totalEarnings,
      platformReferredEmails: localUser.platformReferredEmails || []
    })
  } catch (error) {
    console.error('Error in GET /api/platformreferrals:', error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function POST() {
  try {
    const [session, clerkUser] = await Promise.all([
      auth(),
      currentUser()
    ])

    if (!clerkUser) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const userEmail = clerkUser.emailAddresses[0]?.emailAddress
    if (!userEmail) {
      return new NextResponse("Email not found", { status: 400 })
    }

    // Verify user exists in local DB
    const localUser = await db.user.findUnique({
      where: { email: userEmail }
    })

    if (!localUser) {
      return new NextResponse("User not found in local database", { status: 404 })
    }

    // Check if user already has 5 active links
    const activeLinks = await db.platformReferralLink.count({
      where: {
        email: userEmail,
        isActive: true
      }
    })

    if (activeLinks >= 5) {
      return new NextResponse("Maximum number of active links reached", { status: 400 })
    }

    // Create new referral link
    const newLink = await db.platformReferralLink.create({
      data: {
        email: userEmail,
        code: generateUniqueCode(clerkUser.id),
        isActive: true
      },
      include: {
        platformReferrals: {
          include: {
            platformReferredUser: {
              select: {
                email: true,
                name: true,
                platformReferralEarnings: true,
                createdAt: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(newLink)
  } catch (error) {
    console.error('Error in POST /api/platformreferrals:', error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
} 