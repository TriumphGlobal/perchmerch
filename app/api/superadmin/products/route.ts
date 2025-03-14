import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs"
import { db } from "@/lib/db"

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

    const { searchParams } = new URL(req.url)
    const includeHidden = searchParams.get("includeHidden") === "true"
    const brandId = searchParams.get("brandId")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const skip = (page - 1) * limit

    // Get products with their brands
    const products = await db.product.findMany({
      where: {
        isDeleted: false,
        ...(!includeHidden && { isHidden: false }),
        ...(brandId && { brandId })
      },
      include: {
        brand: {
          select: {
            name: true,
            brandId: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      skip,
      take: limit
    })

    // Get total count for pagination
    const total = await db.product.count({
      where: {
        isDeleted: false,
        ...(!includeHidden && { isHidden: false }),
        ...(brandId && { brandId })
      }
    })

    return NextResponse.json({ 
      success: true, 
      products,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        perPage: limit
      }
    })
  } catch (error) {
    console.error("[PRODUCTS_LIST_ERROR]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 