import { auth } from "@clerk/nextjs"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    if (!user || !["SUPERADMIN", "PLATFORMADMIN"].includes(user.role)) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get("productId")
    const brandId = searchParams.get("brandId")
    const timeframe = searchParams.get("timeframe") || "30d"
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // Calculate date range
    let dateFrom: Date
    let dateTo = new Date()

    if (startDate && endDate) {
      dateFrom = new Date(startDate)
      dateTo = new Date(endDate)
    } else {
      const days = timeframe === "7d" ? 7 : timeframe === "90d" ? 90 : 30
      dateFrom = new Date(dateTo.getTime() - days * 24 * 60 * 60 * 1000)
    }

    // Fetch products with optional filters
    const products = await prisma.product.findMany({
      where: {
        id: productId || undefined,
        brandId: brandId || undefined,
        isDeleted: false
      },
      include: {
        variants: {
          where: { isDeleted: false },
          select: {
            id: true,
            title: true,
            totalSales: true,
            totalRevenue: true,
            inventory: true,
            price: true
          }
        }
      }
    })

    // Fetch analytics data for each product
    const analytics = await Promise.all(
      products.map(async (product) => {
        // Get daily stats with raw SQL for better performance
        const dailyStats = await prisma.$queryRaw`
          WITH dates AS (
            SELECT generate_series(
              ${dateFrom}::timestamp,
              ${dateTo}::timestamp,
              '1 day'::interval
            ) AS date
          ),
          analytics_data AS (
            SELECT
              a.createdAt::date as date,
              COUNT(CASE WHEN a.type = 'PRODUCT_VIEW' THEN 1 END) as views,
              COUNT(CASE WHEN a.type = 'PRODUCT_CLICK' THEN 1 END) as clicks
            FROM dates d
            LEFT JOIN "Analytics" a ON d.date = a.createdAt::date
              AND a.data->>'productId' = ${product.id}
            GROUP BY a.createdAt::date
          ),
          order_data AS (
            SELECT
              o.createdAt::date as date,
              COUNT(DISTINCT o.id) as sales,
              SUM(o.totalAmount) as revenue
            FROM dates d
            LEFT JOIN "Order" o ON d.date = o.createdAt::date
              AND o.brandId = ${product.brandId}
            GROUP BY o.createdAt::date
          )
          SELECT
            dates.date::date,
            COALESCE(analytics_data.views, 0) as views,
            COALESCE(analytics_data.clicks, 0) as clicks,
            COALESCE(order_data.sales, 0) as sales,
            COALESCE(order_data.revenue, 0) as revenue
          FROM dates
          LEFT JOIN analytics_data ON dates.date = analytics_data.date
          LEFT JOIN order_data ON dates.date = order_data.date
          ORDER BY dates.date
        `

        // Get top affiliates
        const topAffiliates = await prisma.affiliate.findMany({
          where: {
            brandId: product.brandId,
            orders: {
              some: {
                createdAt: {
                  gte: dateFrom,
                  lte: dateTo
                }
              }
            }
          },
          select: {
            id: true,
            user: {
              select: {
                name: true
              }
            },
            orders: {
              where: {
                createdAt: {
                  gte: dateFrom,
                  lte: dateTo
                }
              },
              select: {
                totalAmount: true
              }
            }
          },
          take: 5,
          orderBy: {
            totalSales: 'desc'
          }
        })

        // Calculate inventory value
        const inventoryValue = product.variants.reduce((total, variant) => 
          total + (variant.inventory * variant.price), 0)

        // Calculate average order value
        const totalOrders = dailyStats.reduce((sum, day) => sum + day.sales, 0)
        const totalRevenue = dailyStats.reduce((sum, day) => sum + day.revenue, 0)
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

        // Calculate stock turnover rate
        const totalSales = product.variants.reduce((sum, variant) => sum + variant.totalSales, 0)
        const averageInventory = product.variants.reduce((sum, variant) => sum + variant.inventory, 0) / product.variants.length
        const stockTurnoverRate = averageInventory > 0 ? totalSales / averageInventory : 0

        // Calculate profit margin (assuming 50% margin for this example)
        const profitMargin = 0.5

        // Calculate total views and clicks
        const totalViews = dailyStats.reduce((sum, day) => sum + day.views, 0)
        const totalClicks = dailyStats.reduce((sum, day) => sum + day.clicks, 0)

        // Format affiliate data
        const formattedAffiliates = topAffiliates.map(affiliate => ({
          affiliateId: affiliate.id,
          affiliateName: affiliate.user.name || 'Unknown',
          sales: affiliate.orders.length,
          revenue: affiliate.orders.reduce((sum, order) => sum + order.totalAmount, 0)
        }))

        return {
          id: product.id,
          title: product.title,
          totalViews,
          totalClicks,
          totalSales: product.totalSales,
          totalRevenue: product.totalRevenue,
          conversionRate: totalClicks > 0 ? totalSales / totalClicks : 0,
          variants: product.variants,
          dailyStats: dailyStats.map(stat => ({
            date: stat.date.toISOString().split('T')[0],
            views: Number(stat.views),
            clicks: Number(stat.clicks),
            sales: Number(stat.sales),
            revenue: Number(stat.revenue)
          })),
          topAffiliates: formattedAffiliates,
          inventoryValue,
          averageOrderValue,
          stockTurnoverRate,
          profitMargin
        }
      })
    )

    return NextResponse.json({
      success: true,
      analytics
    })
  } catch (error) {
    console.error("Error fetching product analytics:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 