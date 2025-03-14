import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs"
import { db } from "@/lib/db"

export async function GET(
  req: Request,
  { params }: { params: { brandId: string } }
) {
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

    const { brandId } = params
    const { searchParams } = new URL(req.url)
    const timeframe = searchParams.get("timeframe") || "7d"

    // Get the date range based on timeframe
    const now = new Date()
    let startDate = new Date()
    switch (timeframe) {
      case "30d":
        startDate.setDate(now.getDate() - 30)
        break
      case "90d":
        startDate.setDate(now.getDate() - 90)
        break
      case "all":
        startDate = new Date(0) // Beginning of time
        break
      default: // 7d
        startDate.setDate(now.getDate() - 7)
    }

    // Get the brand with complete information
    const brand = await db.brand.findFirst({
      where: {
        OR: [
          { id: brandId },
          { brandId: brandId }
        ]
      },
      include: {
        products: true,
        orders: {
          where: {
            createdAt: {
              gte: startDate
            }
          }
        },
        affiliates: {
          include: {
            orders: {
              where: {
                createdAt: {
                  gte: startDate
                }
              }
            }
          }
        }
      }
    })

    if (!brand) {
      return new NextResponse("Brand not found", { status: 404 })
    }

    // Get analytics data
    const analytics = await db.analytics.findMany({
      where: {
        brandId: brand.id,
        createdAt: {
          gte: startDate
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Calculate daily stats
    const dailyStats = new Map()
    const dateRange = []
    let currentDate = new Date(startDate)
    
    while (currentDate <= now) {
      const dateStr = currentDate.toISOString().split('T')[0]
      dateRange.push(dateStr)
      dailyStats.set(dateStr, {
        date: dateStr,
        sales: 0,
        orders: 0,
        clicks: 0
      })
      currentDate.setDate(currentDate.getDate() + 1)
    }

    // Process orders
    brand.orders.forEach(order => {
      const dateStr = order.createdAt.toISOString().split('T')[0]
      const stats = dailyStats.get(dateStr)
      if (stats) {
        stats.sales += order.totalAmount
        stats.orders += 1
      }
    })

    // Process analytics
    analytics.forEach(event => {
      const dateStr = event.createdAt.toISOString().split('T')[0]
      const stats = dailyStats.get(dateStr)
      if (stats && event.type === "PRODUCT_VIEW") {
        stats.clicks += 1
      }
    })

    // Calculate totals
    const totalSales = brand.orders.reduce((sum, order) => sum + order.totalAmount, 0)
    const totalEarnings = brand.orders.reduce((sum, order) => sum + order.brandEarnings, 0)
    const orderCount = brand.orders.length
    const affiliateOrders = brand.affiliates.reduce((sum, aff) => sum + aff.orders.length, 0)
    const clickCount = analytics.filter(event => event.type === "PRODUCT_VIEW").length
    const conversionRate = clickCount > 0 ? orderCount / clickCount : 0

    return NextResponse.json({
      success: true,
      analytics: {
        id: brand.id,
        name: brand.name,
        totalSales,
        totalEarnings,
        productCount: brand.products.length,
        hiddenProductCount: brand.products.filter(p => p.isHidden).length,
        orderCount,
        affiliateCount: affiliateOrders,
        clickCount,
        conversionRate,
        dailyStats: Array.from(dailyStats.values())
      }
    })
  } catch (error) {
    console.error("[BRAND_ANALYTICS_ERROR]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 