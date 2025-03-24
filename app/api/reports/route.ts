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
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    // Build where clause
    const where: any = {}
    if (status) where.status = status
    if (type) where.type = type

    // Get reports
    const reports = await db.report.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    return NextResponse.json(reports)
  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    // Check authentication
    const auth = await authenticatedMiddleware(request)
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: 401 })
    }

    // Get request body
    const body = await request.json()
    const { type, targetId, reason, description } = body

    // Validate required fields
    if (!type || !targetId || !reason || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get target name based on type
    let targetName = ''
    switch (type) {
      case 'user':
        const user = await db.user.findUnique({ where: { id: targetId } })
        targetName = user?.name || user?.email || 'Unknown User'
        break
      case 'brand':
        const brand = await db.brand.findUnique({ where: { id: targetId } })
        targetName = brand?.name || 'Unknown Brand'
        break
      case 'product':
        const product = await db.product.findUnique({ where: { id: targetId } })
        targetName = product?.name || 'Unknown Product'
        break
      default:
        return NextResponse.json(
          { error: 'Invalid report type' },
          { status: 400 }
        )
    }

    // Create report
    const report = await db.report.create({
      data: {
        type,
        targetId,
        targetName,
        reason,
        description,
        reporterEmail: auth.user.email,
        status: 'pending'
      }
    })

    return NextResponse.json(report)
  } catch (error) {
    console.error('Error creating report:', error)
    return NextResponse.json(
      { error: 'Failed to create report' },
      { status: 500 }
    )
  }
} 