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
    const products = await prisma.product.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        imageUrl: true,
        isHidden: true,
        isDeleted: true,
        deletedAt: true,
        deletedBy: true,
        brandId: true,
        brand: {
          select: {
            name: true,
            brandId: true,
            userEmail: true
          }
        },
        createdAt: true,
        updatedAt: true,
        totalViews: true,
        totalClicks: true,
        totalSales: true,
        totalRevenue: true,
        variants: {
          select: {
            id: true,
            title: true,
            price: true,
            sku: true,
            inventory: true,
            isHidden: true,
            totalSales: true,
            totalRevenue: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json({ products })
  } catch (error) {
    console.error("Error fetching products:", error)
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
    const { productId, action } = await request.json()

    if (!productId || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    if (action === "hide") {
      await prisma.product.update({
        where: { id: productId },
        data: {
          isHidden: true,
          updatedAt: new Date()
        }
      })
    } else if (action === "show") {
      await prisma.product.update({
        where: { id: productId },
        data: {
          isHidden: false,
          updatedAt: new Date()
        }
      })
    } else if (action === "delete" && user.role === "superAdmin") {
      await prisma.product.update({
        where: { id: productId },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: user.email
        }
      })
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating product:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 
 