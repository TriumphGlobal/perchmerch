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
    const brandId = searchParams.get("brandId")
    const timeframe = searchParams.get("timeframe") || "30d"

    // Calculate date range
    const now = new Date()
    const startDate = new Date()
    switch (timeframe) {
      case "7d":
        startDate.setDate(now.getDate() - 7)
        break
      case "90d":
        startDate.setDate(now.getDate() - 90)
        break
      default: // 30d
        startDate.setDate(now.getDate() - 30)
    }

    // Get brands query
    const brandsQuery = brandId
      ? db.brand.findUnique({
          where: { id: brandId }
        })
      : db.brand.findMany({
          where: {
            isDeleted: false
          }
        })

    // Get brands
    const brands = await brandsQuery

    if (!brands) {
      return new NextResponse("Brand(s) not found", { status: 404 })
    }

    // Convert to array if single brand
    const brandsArray = Array.isArray(brands) ? brands : [brands]

    // Get analytics for each brand
    const analytics = await Promise.all(
      brandsArray.map(async (brand) => {
        // Get orders in date range
        const orders = await db.order.findMany({
          where: {
            brandId: brand.id,
            createdAt: {
              gte: startDate,
              lte: now
            }
          },
          include: {
            affiliate: true
          }
        })

        // Get active affiliates
        const affiliates = await db.affiliate.findMany({
          where: {
            brandId: brand.id,
            status: "APPROVED"
          },
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            },
            orders: {
              where: {
                createdAt: {
                  gte: startDate,
                  lte: now
                }
              }
            }
          }
        })

        // Calculate daily stats
        const dailyStats = new Map()
        const msPerDay = 24 * 60 * 60 * 1000
        for (let d = new Date(startDate); d <= now; d = new Date(d.getTime() + msPerDay)) {
          dailyStats.set(d.toISOString().split('T')[0], {
            date: d.toISOString(),
            sales: 0,
            orders: 0
          })
        }

        // Populate daily stats
        orders.forEach(order => {
          const day = order.createdAt.toISOString().split('T')[0]
          const stats = dailyStats.get(day)
          if (stats) {
            stats.sales += order.totalAmount
            stats.orders += 1
          }
        })

        // Calculate top affiliates
        const topAffiliates = affiliates
          .map(affiliate => ({
            id: affiliate.id,
            name: affiliate.user.name || affiliate.user.email,
            sales: affiliate.orders.reduce((sum, order) => sum + order.totalAmount, 0),
            commission: affiliate.orders.reduce((sum, order) => sum + (order.affiliateDue || 0), 0)
          }))
          .sort((a, b) => b.sales - a.sales)
          .slice(0, 5)

        // Get social media links
        const socialMedia = await db.brandSocialMedia.findUnique({
          where: { brandId: brand.id }
        })

        return {
          id: brand.id,
          name: brand.name,
          totalSales: orders.reduce((sum, order) => sum + order.totalAmount, 0),
          totalEarnings: orders.reduce((sum, order) => sum + order.brandEarnings, 0),
          orderCount: orders.length,
          affiliateCount: affiliates.length,
          conversionRate: affiliates.reduce((sum, aff) => sum + aff.conversionRate, 0) / (affiliates.length || 1),
          averageOrderValue: orders.length > 0 
            ? orders.reduce((sum, order) => sum + order.totalAmount, 0) / orders.length 
            : 0,
          salesTrend: Array.from(dailyStats.values()),
          topAffiliates,
          socialMedia: socialMedia || {}
        }
      })
    )

    return NextResponse.json({
      success: true,
      analytics
    })
  } catch (error) {
    console.error("[BRAND_ANALYTICS_ERROR]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 