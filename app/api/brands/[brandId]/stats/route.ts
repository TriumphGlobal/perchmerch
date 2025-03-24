import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: { brandId: string } }
) {
  try {
    const { userId } = auth()

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const brand = await prisma.brand.findUnique({
      where: {
        brandId: params.brandId,
      },
      include: {
        products: {
          include: {
            orders: true,
          },
        },
        affiliates: {
          include: {
            orders: true,
          },
        },
      },
    })

    if (!brand) {
      return new NextResponse("Brand not found", { status: 404 })
    }

    // Check if user owns the brand
    if (brand.userId !== userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Calculate statistics
    const now = new Date()
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30))

    const stats = {
      dailyVisitors: Math.floor(Math.random() * 1000), // TODO: Implement actual analytics
      monthlyVisitors: Math.floor(Math.random() * 30000), // TODO: Implement actual analytics
      totalProducts: brand.products.length,
      activeAffiliates: brand.affiliates.filter(a => a.status === "ACTIVE").length,
      pendingAffiliates: brand.affiliates.filter(a => a.status === "PENDING").length,
      recentOrders: brand.products
        .flatMap(p => p.orders)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 10)
        .map(order => ({
          id: order.id,
          customer: order.customerName,
          product: brand.products.find(p => 
            p.orders.some(o => o.id === order.id)
          )?.name || "Unknown Product",
          amount: order.amount,
          status: order.status,
          date: order.createdAt,
        })),
      topProducts: brand.products
        .map(product => ({
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          imageUrl: product.imageUrl,
          totalSales: product.orders.length,
          totalRevenue: product.orders.reduce((sum, order) => sum + order.amount, 0),
          inStock: product.inStock,
        }))
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 10),
      topAffiliates: brand.affiliates
        .map(affiliate => ({
          id: affiliate.id,
          name: affiliate.name,
          email: affiliate.email,
          avatarUrl: affiliate.avatarUrl,
          totalSales: affiliate.orders.length,
          totalRevenue: affiliate.orders.reduce((sum, order) => sum + order.amount, 0),
          totalClicks: Math.floor(Math.random() * 1000), // TODO: Implement actual analytics
          conversionRate: Math.random() * 0.1, // TODO: Implement actual analytics
          status: affiliate.status.toLowerCase(),
        }))
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 10),
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("[BRAND_STATS]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 