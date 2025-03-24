import { auth } from "@clerk/nextjs"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Get user from local DB to check role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    if (user?.role !== "admin" && user?.role !== "superAdmin") {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const links = await prisma.genreLink.findMany({
      include: {
        createdBy: {
          select: {
            email: true
          }
        }
      }
    })

    return NextResponse.json({ links })
  } catch (error) {
    console.error("[GENRE_LINKS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Get user from local DB to check role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    if (user?.role !== "admin" && user?.role !== "superAdmin") {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const body = await req.json()
    const { sourceGenreId, targetGenreId } = body

    if (!sourceGenreId || !targetGenreId) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    // Check if link already exists
    const existingLink = await prisma.genreLink.findFirst({
      where: {
        OR: [
          {
            sourceGenreId,
            targetGenreId
          },
          {
            sourceGenreId: targetGenreId,
            targetGenreId: sourceGenreId
          }
        ]
      }
    })

    if (existingLink) {
      return new NextResponse("Link already exists", { status: 400 })
    }

    const link = await prisma.genreLink.create({
      data: {
        sourceGenreId,
        targetGenreId,
        createdById: userId
      },
      include: {
        createdBy: {
          select: {
            email: true
          }
        }
      }
    })

    return NextResponse.json(link)
  } catch (error) {
    console.error("[GENRE_LINKS_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 