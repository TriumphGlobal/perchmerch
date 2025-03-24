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
    const brands = await prisma.brand.findMany({
      where: {
        isDeleted: false,
      },
      select: {
        id: true,
        name: true,
        description: true,
        isApproved: true,
        ownerEmail: true,
        createdAt: true,
        updatedAt: true,
        genres: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json({ brands })
  } catch (error) {
    console.error("Error fetching brands:", error)
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
    const { brandId, action, reason } = await request.json()

    if (!brandId || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const brand = await prisma.brand.findUnique({
      where: { id: brandId }
    })

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 })
    }

    if (action === "approve") {
      await prisma.brand.update({
        where: { id: brandId },
        data: {
          isApproved: true,
          approvedAt: new Date(),
          approvedBy: user.email
        }
      })
    } else if (action === "reject") {
      await prisma.brand.update({
        where: { id: brandId },
        data: {
          isApproved: false,
          rejectedAt: new Date(),
          rejectedBy: user.email,
          rejectionReason: reason || "No reason provided"
        }
      })
    } else if (action === "hide") {
      await prisma.brand.update({
        where: { id: brandId },
        data: {
          isHidden: true,
          hiddenAt: new Date(),
          hiddenBy: user.email,
          hiddenReason: reason || "No reason provided"
        }
      })
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating brand:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 
 