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
    const { sourceGenreId, targetGenreIds } = body

    // Validate required fields
    if (!sourceGenreId || !Array.isArray(targetGenreIds) || targetGenreIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get source genre
    const sourceGenre = await db.genre.findUnique({
      where: { id: sourceGenreId }
    })

    if (!sourceGenre) {
      return NextResponse.json(
        { error: 'Source genre not found' },
        { status: 404 }
      )
    }

    // Update source genre with linked genres
    const updatedSourceGenre = await db.genre.update({
      where: { id: sourceGenreId },
      data: {
        linkedGenres: targetGenreIds,
        lastModifiedAt: new Date(),
        lastModifiedByEmail: auth.user.email
      }
    })

    // Update all target genres to link back to source genre
    await Promise.all(
      targetGenreIds.map(targetId =>
        db.genre.update({
          where: { id: targetId },
          data: {
            linkedGenres: {
              push: sourceGenreId
            },
            lastModifiedAt: new Date(),
            lastModifiedByEmail: auth.user.email
          }
        })
      )
    )

    return NextResponse.json(updatedSourceGenre)
  } catch (error) {
    console.error('Error linking genres:', error)
    return NextResponse.json(
      { error: 'Failed to link genres' },
      { status: 500 }
    )
  }
} 