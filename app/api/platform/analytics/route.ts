import { authenticatedMiddleware } from "@/lib/auth"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const user = await authenticatedMiddleware()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (user.role !== "platformAdmin" && user.role !== "superAdmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    // Get platform-wide analytics
    const [
      brandCount,
      brandStats,
      productCount,
      productStats,
      orderCount,
      orderStats,
      userCount,
      userReferralSum
    ] = await Promise.all([
      // Brand count
      prisma.brand.count(),

      // Brand statistics
      prisma.brand.aggregate({
        _sum: {
          totalSales: true,
          totalEarnings: true,
          totalOrders: true,
          totalClicks: true
        },
        _avg: {
          conversionRate: true,
          averageOrderValue: true
        }
      }),

      // Product count
      prisma.product.count(),

      // Product statistics
      prisma.product.aggregate({
        _sum: {
          totalViews: true,
          totalClicks: true,
          totalSales: true,
          totalRevenue: true
        }
      }),

      // Order count
      prisma.order.count(),

      // Order statistics
      prisma.order.aggregate({
        _sum: {
          totalAmount: true,
          brandEarnings: true,
          platformReferredByDue: true,
          affiliateDue: true
        }
      }),

      // User count
      prisma.user.count(),

      // User referral earnings sum
      prisma.user.aggregate({
        _sum: {
          platformReferralEarnings: true
        }
      })
    ])

    // Get top performing brands
    const topBrands = await prisma.brand.findMany({
      where: {
        isDeleted: false
      },
      select: {
        id: true,
        name: true,
        brandId: true,
        totalSales: true,
        totalEarnings: true,
        totalOrders: true,
        totalClicks: true,
        conversionRate: true,
        averageOrderValue: true,
        userEmail: true
      },
      orderBy: {
        totalSales: "desc"
      },
      take: 10
    })

    // Get top performing products
    const topProducts = await prisma.product.findMany({
      where: {
        isDeleted: false
      },
      select: {
        id: true,
        title: true,
        price: true,
        totalViews: true,
        totalClicks: true,
        totalSales: true,
        totalRevenue: true,
        brand: {
          select: {
            name: true,
            brandId: true
          }
        }
      },
      orderBy: {
        totalRevenue: "desc"
      },
      take: 10
    })

    // Get top affiliates
    const topAffiliates = await prisma.affiliate.findMany({
      select: {
        id: true,
        email: true,
        totalSales: true,
        totalDue: true,
        totalPaid: true,
        clickCount: true,
        conversionRate: true,
        brand: {
          select: {
            name: true,
            brandId: true
          }
        }
      },
      orderBy: {
        totalSales: "desc"
      },
      take: 10
    })

    return NextResponse.json({
      overview: {
        brands: {
          total: brandCount,
          totalSales: brandStats._sum.totalSales || 0,
          totalEarnings: brandStats._sum.totalEarnings || 0,
          totalOrders: brandStats._sum.totalOrders || 0,
          totalClicks: brandStats._sum.totalClicks || 0,
          averageConversionRate: brandStats._avg.conversionRate || 0,
          averageOrderValue: brandStats._avg.averageOrderValue || 0
        },
        products: {
          total: productCount,
          totalViews: productStats._sum.totalViews || 0,
          totalClicks: productStats._sum.totalClicks || 0,
          totalSales: productStats._sum.totalSales || 0,
          totalRevenue: productStats._sum.totalRevenue || 0
        },
        orders: {
          total: orderCount,
          totalAmount: orderStats._sum.totalAmount || 0,
          brandEarnings: orderStats._sum.brandEarnings || 0,
          platformReferralEarnings: orderStats._sum.platformReferredByDue || 0,
          affiliateEarnings: orderStats._sum.affiliateDue || 0
        },
        users: {
          total: userCount,
          totalReferralEarnings: userReferralSum._sum.platformReferralEarnings || 0
        }
      },
      topPerformers: {
        brands: topBrands,
        products: topProducts,
        affiliates: topAffiliates
      }
    })
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 
 