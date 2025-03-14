import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs"
import { db } from "@/lib/db"

export async function POST(
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
    const { isHidden } = body

    if (typeof isHidden !== "boolean") {
      return new NextResponse("Invalid visibility status", { status: 400 })
    }

    // Get the genre
    const genre = await db.genre.findUnique({
      where: { id: genreId }
    })

    if (!genre) {
      return new NextResponse("Genre not found", { status: 404 })
    }

    // Update genre visibility
    await db.genre.update({
      where: { id: genreId },
      data: {
        isHidden,
        lastModifiedBy: userId,
        lastModifiedAt: new Date()
      }
    })

    // Log the activity
    await db.userActivity.create({
      data: {
        userId,
        type: isHidden ? "GENRE_HIDDEN" : "GENRE_UNHIDDEN",
        details: JSON.stringify({
          genreId: genre.id,
          genreName: genre.name
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[GENRE_VISIBILITY_ERROR]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 