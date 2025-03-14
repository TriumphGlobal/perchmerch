import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  try {
    // Get all visible genres
    const genres = await db.genre.findMany({
      where: {
        isHidden: false
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({ 
      success: true,
      genres: genres.map(genre => ({
        id: genre.id,
        name: genre.name,
        isHidden: genre.isHidden
      }))
    })
  } catch (error) {
    console.error("[GENRE_LIST_ERROR]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name } = body

    if (!name || typeof name !== "string") {
      return new NextResponse("Invalid genre name", { status: 400 })
    }

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
      if (existingGenre.isHidden) {
        return new NextResponse(JSON.stringify({ 
          error: "This genre name is not allowed" 
        }), { status: 400 })
      }
      return NextResponse.json({ success: true, genre: existingGenre })
    }

    // Create the genre (pending admin approval)
    const genre = await db.genre.create({
      data: {
        name,
        isHidden: true // New genres are hidden by default until approved
      }
    })

    return NextResponse.json({ success: true, genre })
  } catch (error) {
    console.error("[GENRE_CREATE_ERROR]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 