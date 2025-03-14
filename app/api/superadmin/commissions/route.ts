import { auth } from "@clerk/nextjs"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    if (!user || !["SUPERADMIN", "PLATFORMADMIN"].includes(user.role)) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get("brandId")

    // Fetch brand commissions
    const brandCommissions = await prisma.brandCommission.findMany({
      where: brandId ? { brandId } : undefined,
      include: {
        brand: {
          select: {
            name: true
          }
        },
        tiers: {
          orderBy: {
            minSales: "asc"
          }
        }
      }
    })

    // Fetch genre commissions
    const genreCommissions = await prisma.genreCommission.findMany({
      include: {
        genre: {
          select: {
            name: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      brandCommissions,
      genreCommissions
    })
  } catch (error) {
    console.error("Error fetching commissions:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 