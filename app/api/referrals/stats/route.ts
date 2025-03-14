import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const { userId } = auth()

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Get all referral links for the user with their stats
    const referralLinks = await prisma.referralLink.findMany({
      where: { userId },
      select: {
        code: true,
        createdAt: true,
        _count: {
          select: {
            referredUsers: true
          }
        },
        referredUsers: {
          select: {
            orders: {
              select: {
                commission: true
              }
            }
          }
        }
      }
    })

    // Get all referred users across all referral links
    const referredUsers = await prisma.user.findMany({
      where: {
        referralLinkId: {
          in: referralLinks.map(link => link.code)
        }
      },
      select: {
        name: true,
        email: true,
        status: true,
        createdAt: true,
        orders: {
          select: {
            commission: true
          }
        }
      }
    })

    // Calculate total stats
    const totalReferrals = referredUsers.length
    const activeReferrals = referredUsers.filter(user => user.status === "ACTIVE").length
    const totalEarnings = referredUsers.reduce((sum, user) => 
      sum + user.orders.reduce((orderSum, order) => orderSum + (order.commission * 0.05), 0), 0)
    const pendingEarnings = referredUsers
      .filter(user => user.status !== "ACTIVE")
      .reduce((sum, user) => 
        sum + user.orders.reduce((orderSum, order) => orderSum + (order.commission * 0.05), 0), 0)

    // Format referral links with their individual stats
    const formattedLinks = referralLinks.map(link => ({
      code: link.code,
      createdAt: link.createdAt,
      totalReferrals: link._count.referredUsers,
      totalEarnings: link.referredUsers.reduce((sum, user) => 
        sum + user.orders.reduce((orderSum, order) => orderSum + (order.commission * 0.05), 0), 0)
    }))

    // Format referred users
    const formattedUsers = referredUsers.map(user => ({
      name: user.name,
      email: user.email,
      status: user.status,
      earnings: user.orders.reduce((sum, order) => sum + (order.commission * 0.05), 0),
      joinedAt: user.createdAt
    }))

    return NextResponse.json({
      referralLinks: formattedLinks,
      totalReferrals,
      activeReferrals,
      totalEarnings,
      pendingEarnings,
      referredUsers: formattedUsers
    })
  } catch (error) {
    console.error("[REFERRAL_STATS]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 