import { NextResponse } from "next/server"
import { authenticatedMiddleware } from "../../../../lib/auth"
import { db } from "../../../../lib/db"

export async function POST(request: Request) {
  try {
    // Check authentication
    const auth = await authenticatedMiddleware(request)
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: 401 })
    }

    // Verify user is a platform moderator
    if (!auth.user?.role || !['platformAdmin', 'superAdmin'].includes(auth.user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Get request body
    const body = await request.json()
    const { reportId, isResolved, actionNotes } = body

    // Validate required fields
    if (!reportId || typeof isResolved !== 'boolean' || !actionNotes) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get the report
    const report = await db.report.findUnique({
      where: { id: reportId }
    })

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      )
    }

    // Update report status
    const updatedReport = await db.report.update({
      where: { id: reportId },
      data: {
        status: isResolved ? 'resolved' : 'dismissed',
        actionNotes
      }
    })

    // If resolved, take action based on report type
    if (isResolved) {
      switch (report.type) {
        case 'user':
          await db.user.update({
            where: { id: report.targetId },
            data: {
              bannedAt: new Date(),
              bannedBy: auth.user.email,
              banReason: actionNotes
            }
          })
          break
        case 'brand':
          await db.brand.update({
            where: { id: report.targetId },
            data: {
              isHidden: true,
              lastModifiedAt: new Date(),
              lastModifiedByEmail: auth.user.email
            }
          })
          break
        case 'product':
          await db.product.update({
            where: { id: report.targetId },
            data: {
              isHidden: true,
              lastModifiedAt: new Date(),
              lastModifiedByEmail: auth.user.email
            }
          })
          break
      }
    }

    return NextResponse.json(updatedReport)
  } catch (error) {
    console.error('Error resolving report:', error)
    return NextResponse.json(
      { error: 'Failed to resolve report' },
      { status: 500 }
    )
  }
} 