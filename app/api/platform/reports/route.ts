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
    // Get active temporary bans
    const temporaryBans = await prisma.temporaryBan.findMany({
      where: {
        expiresAt: {
          gt: new Date()
        }
      },
      select: {
        id: true,
        brandId: true,
        reason: true,
        bannedByEmail: true,
        bannedAt: true,
        expiresAt: true,
        createdAt: true,
        admin: {
          select: {
            name: true,
            email: true
          }
        },
        brand: {
          select: {
            name: true,
            brandId: true,
            userEmail: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json({ temporaryBans })
  } catch (error) {
    console.error("Error fetching reports:", error)
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
    const { brandId, reason, duration } = await request.json()

    if (!brandId || !reason || !duration) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Calculate expiration date
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + duration)

    // Create temporary ban
    const ban = await prisma.temporaryBan.create({
      data: {
        brandId,
        reason,
        expiresAt,
        bannedByEmail: user.email
      }
    })

    // Hide the brand
    await prisma.brand.update({
      where: { id: brandId },
      data: {
        isHidden: true
      }
    })

    return NextResponse.json({ success: true, ban })
  } catch (error) {
    console.error("Error creating temporary ban:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const user = await authenticatedMiddleware()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (user.role !== "platformAdmin" && user.role !== "superAdmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { banId } = await request.json()

    if (!banId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get ban details
    const ban = await prisma.temporaryBan.findUnique({
      where: { id: banId }
    })

    if (!ban) {
      return NextResponse.json({ error: "Ban not found" }, { status: 404 })
    }

    // Remove ban and unhide brand
    await prisma.$transaction([
      prisma.temporaryBan.delete({
        where: { id: banId }
      }),
      prisma.brand.update({
        where: { id: ban.brandId },
        data: {
          isHidden: false
        }
      })
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing temporary ban:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 
 