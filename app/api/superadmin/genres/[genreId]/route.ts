import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs"
import { db } from "@/lib/db"
import { z } from "zod"

const updateGenreSchema = z.object({
  name: z.string()
    .min(2, "Genre name must be at least 2 characters")
    .max(50, "Genre name must be at most 50 characters")
    .regex(/^[a-zA-Z\s-]+$/, "Genre name can only contain letters, spaces, and hyphens")
})

export async function PATCH(
  req: Request,
  { params }: { params: { genreId: string } }
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

    const { genreId } = params
    const body = await req.json()
    const validatedData = updateGenreSchema.safeParse(body)

    if (!validatedData.success) {
      return new NextResponse(JSON.stringify({ 
        error: validatedData.error.issues[0].message 
      }), { status: 400 })
    }

    const { name } = validatedData.data

    // Get the genre
    const genre = await db.genre.findUnique({
      where: { id: genreId }
    })

    if (!genre) {
      return new NextResponse("Genre not found", { status: 404 })
    }

    // Check if new name already exists (case insensitive)
    const existingGenre = await db.genre.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive'
        },
        NOT: {
          id: genreId
        }
      }
    })

    if (existingGenre) {
      return new NextResponse(JSON.stringify({ 
        error: "A genre with this name already exists" 
      }), { status: 400 })
    }

    // Update the genre
    await db.genre.update({
      where: { id: genreId },
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
        type: "GENRE_RENAME",
        details: JSON.stringify({
          genreId: genre.id,
          oldName: genre.name,
          newName: name
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[GENRE_UPDATE_ERROR]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 