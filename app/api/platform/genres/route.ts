import { authenticatedMiddleware } from "@/lib/auth"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const user = await authenticatedMiddleware()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (user.role !== "platformAdmin" && user.role !== "superAdmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const genres = await prisma.genre.findMany({
      select: {
        id: true,
        name: true,
        isHidden: true,
        createdAt: true,
        lastModifiedAt: true,
        lastModifiedByEmail: true,
        lastModifiedByUser: {
          select: {
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            brands: true
          }
        }
      },
      orderBy: {
        name: "asc"
      }
    })

    return NextResponse.json({ genres })
  } catch (error) {
    console.error("Error fetching genres:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await authenticatedMiddleware()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (user.role !== "platformAdmin" && user.role !== "superAdmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { genreId, action } = await request.json()

    if (!genreId || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const genre = await prisma.genre.findUnique({
      where: { id: genreId }
    })

    if (!genre) {
      return NextResponse.json({ error: "Genre not found" }, { status: 404 })
    }

    if (action === "hide") {
      await prisma.genre.update({
        where: { id: genreId },
        data: {
          isHidden: true,
          lastModifiedAt: new Date(),
          lastModifiedByEmail: user.email
        }
      })
    } else if (action === "show") {
      await prisma.genre.update({
        where: { id: genreId },
        data: {
          isHidden: false,
          lastModifiedAt: new Date(),
          lastModifiedByEmail: user.email
        }
      })
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating genre:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 
 