import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Check if user is admin
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    if (user?.role !== "SUPERADMIN" && user?.role !== "PLATFORMADMIN") {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const brandId = searchParams.get("brandId")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const skip = (page - 1) * limit

    // Get affiliates with their details
    const affiliates = await db.affiliate.findMany({
      where: {
        ...(status && { status }),
        ...(brandId && { brandId })
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        brand: {
          select: {
            name: true,
            brandId: true
          }
        },
        orders: {
          select: {
            id: true,
            totalAmount: true,
            affiliateDue: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 5
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      skip,
      take: limit
    })

    // Get total count for pagination
    const total = await db.affiliate.count({
      where: {
        ...(status && { status }),
        ...(brandId && { brandId })
      }
    })

    // Calculate additional metrics
    const affiliatesWithMetrics = affiliates.map(affiliate => ({
      ...affiliate,
      metrics: {
        conversionRate: affiliate.clickCount > 0 
          ? (affiliate.orders.length / affiliate.clickCount) * 100 
          : 0,
        averageOrderValue: affiliate.orders.length > 0
          ? affiliate.orders.reduce((sum, order) => sum + order.totalAmount, 0) / affiliate.orders.length
          : 0,
        pendingPayout: affiliate.totalDue - affiliate.totalPaid
      }
    }))

    return NextResponse.json({
      success: true,
      affiliates: affiliatesWithMetrics,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        perPage: limit
      }
    })
  } catch (error) {
    console.error("[AFFILIATES_LIST_ERROR]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 