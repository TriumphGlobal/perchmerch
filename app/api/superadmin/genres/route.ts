import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs"
import { db } from "@/lib/db"
import { z } from "zod"

const createGenreSchema = z.object({
  name: z.string()
    .min(2, "Genre name must be at least 2 characters")
    .max(50, "Genre name must be at most 50 characters")
    .regex(/^[a-zA-Z\s-]+$/, "Genre name can only contain letters, spaces, and hyphens")
})

export async function POST(req: Request) {
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

    const body = await req.json()
    const validatedData = createGenreSchema.safeParse(body)

    if (!validatedData.success) {
      return new NextResponse(JSON.stringify({ 
        error: validatedData.error.issues[0].message 
      }), { status: 400 })
    }

    const { name } = validatedData.data

    // Check if genre already exists (case insensitive)
    const existingGenre = await db.genre.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive'
        }
      }
    })

    if (existingGenre) {
      return new NextResponse(JSON.stringify({ 
        error: "A genre with this name already exists" 
      }), { status: 400 })
    }

    // Create the genre
    const genre = await db.genre.create({
      data: {
        name,
        lastModifiedBy: userId,
        lastModifiedAt: new Date()
      }
    })

    // Log the activity
    await db.userActivity.create({
      data: {
        userId,
        type: "GENRE_CREATE",
        details: JSON.stringify({
          genreId: genre.id,
          genreName: genre.name
        })
      }
    })

    return NextResponse.json({ success: true, genre })
  } catch (error) {
    console.error("[GENRE_CREATE_ERROR]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

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

    // Get all genres with complete information
    const genres = await db.genre.findMany({
      include: {
        brands: true,
        lastModifiedByUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Transform data for frontend
    const transformedGenres = genres.map(genre => ({
      id: genre.id,
      name: genre.name,
      isHidden: genre.isHidden,
      brandCount: genre.brands.length,
      createdAt: genre.createdAt.toISOString(),
      lastModifiedAt: genre.lastModifiedAt.toISOString(),
      lastModifiedBy: genre.lastModifiedByUser
    }))

    return NextResponse.json({ 
      success: true,
      genres: transformedGenres,
      total: transformedGenres.length
    })
  } catch (error) {
    console.error("[GENRE_LIST_ERROR]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 