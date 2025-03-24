import { NextResponse } from "next/server"
import { authenticatedMiddleware } from "../../../lib/auth"
import { db } from "../../../lib/db"

export async function GET(request: Request) {
  try {
    // Check authentication
    const auth = await authenticatedMiddleware(request)
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '7d'

    // Calculate date range
    const now = new Date()
    const rangeInDays = range === '30d' ? 30 : range === '90d' ? 90 : 7
    const startDate = new Date(now)
    startDate.setDate(now.getDate() - rangeInDays)

    // Get total counts
    const [
      totalUsers,
      totalBrands,
      totalProducts,
      totalReports,
      activeUsers,
      newUsersToday,
      newBrandsToday,
      newProductsToday,
      reportsToday
    ] = await Promise.all([
      db.user.count(),
      db.brand.count(),
      db.product.count(),
      db.report.count({ where: { status: 'pending' } }),
      db.user.count({ where: { lastLoginAt: { gte: startDate } } }),
      db.user.count({ where: { createdAt: { gte: new Date(now.setHours(0, 0, 0, 0)) } } }),
      db.brand.count({ where: { createdAt: { gte: new Date(now.setHours(0, 0, 0, 0)) } } }),
      db.product.count({ where: { createdAt: { gte: new Date(now.setHours(0, 0, 0, 0)) } } }),
      db.report.count({ where: { createdAt: { gte: new Date(now.setHours(0, 0, 0, 0)) } } })
    ])

    // Get growth data
    const dates = Array.from({ length: rangeInDays }, (_, i) => {
      const date = new Date(now)
      date.setDate(now.getDate() - i)
      return date.toISOString().split('T')[0]
    }).reverse()

    const [userGrowth, brandGrowth, productGrowth, reportTrends] = await Promise.all([
      Promise.all(dates.map(async date => {
        const startOfDay = new Date(`${date}T00:00:00.000Z`)
        const endOfDay = new Date(`${date}T23:59:59.999Z`)
        const count = await db.user.count({
          where: { createdAt: { gte: startOfDay, lte: endOfDay } }
        })
        return { date, count }
      })),
      Promise.all(dates.map(async date => {
        const startOfDay = new Date(`${date}T00:00:00.000Z`)
        const endOfDay = new Date(`${date}T23:59:59.999Z`)
        const count = await db.brand.count({
          where: { createdAt: { gte: startOfDay, lte: endOfDay } }
        })
        return { date, count }
      })),
      Promise.all(dates.map(async date => {
        const startOfDay = new Date(`${date}T00:00:00.000Z`)
        const endOfDay = new Date(`${date}T23:59:59.999Z`)
        const count = await db.product.count({
          where: { createdAt: { gte: startOfDay, lte: endOfDay } }
        })
        return { date, count }
      })),
      Promise.all(dates.map(async date => {
        const startOfDay = new Date(`${date}T00:00:00.000Z`)
        const endOfDay = new Date(`${date}T23:59:59.999Z`)
        const count = await db.report.count({
          where: { createdAt: { gte: startOfDay, lte: endOfDay } }
        })
        return { date, count }
      }))
    ])

    return NextResponse.json({
      totalUsers,
      totalBrands,
      totalProducts,
      totalReports,
      activeUsers,
      newUsersToday,
      newBrandsToday,
      newProductsToday,
      reportsToday,
      userGrowth,
      brandGrowth,
      productGrowth,
      reportTrends
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
} 