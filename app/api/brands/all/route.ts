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

    const brands = await prisma.brand.findMany({
      where: {
        isApproved: true,
        isDeleted: false
      },
      select: {
        id: true,
        name: true,
        brandId: true,
        description: true,
        isFeatured: true,
        totalSales: true,
        products: {
          where: {
            isDeleted: false
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    const formattedBrands = brands.map(brand => ({
      ...brand,
      productCount: brand.products.length,
      products: undefined // Don't send full product data
    }))

    return NextResponse.json({ brands: formattedBrands })
  } catch (error) {
    console.error("[BRANDS_ALL_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 