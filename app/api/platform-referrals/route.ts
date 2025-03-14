import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import prisma from "@/lib/db"
import { generateUniqueCode } from "@/lib/utils"

type ReferralWithUser = {
  id: string
  referrerId: string
  referredUserId: string
  status: string
  earnings: number
  code: string
  createdAt: Date
  completedAt: Date | null
  referredUser: {
    name: string | null
    email: string
  }
}

export async function GET(req: Request) {
  try {
    const { userId } = await auth()
    const { searchParams } = new URL(req.url)
    const queryUserId = searchParams.get("userId")

    if (!userId || userId !== queryUserId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Get referral stats and referrals list
    const referrals = await prisma.platformReferral.findMany({
      where: { referrerId: userId },
      include: {
        referredUser: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Get user's active referral code
    const activeReferral = await prisma.platformReferral.findFirst({
      where: { 
        referrerId: userId,
        status: "PENDING"
      },
      include: {
        referredUser: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculate stats
    const totalReferrals = referrals.length
    const totalEarnings = referrals.reduce((sum: number, ref: ReferralWithUser) => sum + (ref.earnings || 0), 0)
    const pendingReferrals = referrals.filter((ref: ReferralWithUser) => ref.status === "PENDING").length
    const completedReferrals = referrals.filter((ref: ReferralWithUser) => ref.status === "COMPLETED").length

    return NextResponse.json({
      code: activeReferral?.code || "",
      stats: {
        totalReferrals,
        totalEarnings,
        pendingReferrals,
        completedReferrals
      },
      referrals
    })
  } catch (error) {
    console.error("[PLATFORM_REFERRALS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    console.log("[PLATFORM_REFERRALS_POST] Auth userId:", userId)
    
    if (!userId) {
      console.log("[PLATFORM_REFERRALS_POST] No userId from auth")
      return new NextResponse("Unauthorized - No user ID", { status: 401 })
    }

    // Check if user already has an active referral code
    console.log("[PLATFORM_REFERRALS_POST] Checking for existing referral")
    const existingReferral = await prisma.platformReferral.findFirst({
      where: { 
        referrerId: userId,
        status: "PENDING"
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    console.log("[PLATFORM_REFERRALS_POST] Existing referral:", existingReferral)

    if (existingReferral) {
      console.log("[PLATFORM_REFERRALS_POST] Returning existing code:", existingReferral.code)
      return NextResponse.json({ code: existingReferral.code })
    }

    // Generate new referral code
    const code = generateUniqueCode(userId)
    console.log("[PLATFORM_REFERRALS_POST] Generated new code:", code)

    try {
      console.log("[PLATFORM_REFERRALS_POST] Creating new referral")
      const platformReferral = await prisma.platformReferral.create({
        data: {
          code,
          referrerId: userId,
          status: "PENDING",
          earnings: 0
        }
      })
      console.log("[PLATFORM_REFERRALS_POST] Created platform referral:", platformReferral)

      return NextResponse.json({ code: platformReferral.code })
    } catch (error) {
      console.error("[PLATFORM_REFERRALS_POST] Error creating referral:", error)
      throw error
    }
  } catch (error) {
    console.error("[PLATFORM_REFERRALS_POST] Top-level error:", error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("[PLATFORM_REFERRALS_POST] Error details:", errorMessage)
    return new NextResponse(`Internal Error: ${errorMessage}`, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId } = await auth()
    const { referralId, status, earnings } = await req.json()

    if (!userId || !referralId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Only allow updating referrals where the user is the referrer
    const referral = await prisma.platformReferral.findFirst({
      where: {
        id: referralId,
        referrerId: userId
      }
    })

    if (!referral) {
      return new NextResponse("Referral not found", { status: 404 })
    }

    const updatedReferral = await prisma.platformReferral.update({
      where: {
        id: referralId
      },
      data: {
        status,
        earnings,
        completedAt: status === "COMPLETED" ? new Date() : null
      }
    })

    return NextResponse.json(updatedReferral)
  } catch (error) {
    console.error("[PLATFORM_REFERRALS_PATCH]", error instanceof Error ? error.message : String(error))
    return new NextResponse("Internal Error", { status: 500 })
  }
} 