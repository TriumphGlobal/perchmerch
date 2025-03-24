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

    // Get all genres
    const genres = await db.genre.findMany({
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(genres)
  } catch (error) {
    console.error('Error fetching genres:', error)
    return NextResponse.json(
      { error: 'Failed to fetch genres' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    // Check authentication
    const auth = await authenticatedMiddleware(request)
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 })
    }

    // Get request body
    const body = await request.json()
    const { name } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    // Check if genre already exists
    const existingGenre = await db.genre.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } }
    })

    if (existingGenre) {
      // If genre exists, return it (this allows reuse of existing genres)
      return NextResponse.json({ 
        success: true,
        genre: existingGenre
      })
    }

    // Create genre with pending status
    const genre = await db.genre.create({
      data: {
        name: name.toLowerCase(),
        isHidden: true, // New genres start hidden
        lastModifiedByEmail: auth.user.email,
        lastModifiedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      genre
    })
  } catch (error) {
    console.error('Error creating genre:', error)
    return NextResponse.json(
      { error: 'Failed to create genre' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
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
    const { genreId, name, isHidden } = body

    // Validate required fields
    if (!genreId || (!name && typeof isHidden !== 'boolean')) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Update genre
    const updatedGenre = await db.genre.update({
      where: { id: genreId },
      data: {
        ...(name && { name }),
        ...(typeof isHidden === 'boolean' && { isHidden }),
        lastModifiedAt: new Date(),
        lastModifiedByEmail: auth.user.email
      }
    })

    return NextResponse.json(updatedGenre)
  } catch (error) {
    console.error('Error updating genre:', error)
    return NextResponse.json(
      { error: 'Failed to update genre' },
      { status: 500 }
    )
  }
} 