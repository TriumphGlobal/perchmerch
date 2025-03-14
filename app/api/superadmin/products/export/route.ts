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

    // Fetch products with optional brand filter
    const products = await prisma.product.findMany({
      where: {
        brandId: brandId || undefined,
        isDeleted: false
      },
      select: {
        shopifyId: true,
        title: true,
        description: true,
        price: true,
        imageUrl: true,
        brand: {
          select: {
            name: true,
            brandId: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Format products for export
    const formattedProducts = products.map(product => ({
      shopifyId: product.shopifyId,
      title: product.title,
      description: product.description || '',
      price: product.price,
      imageUrl: product.imageUrl || '',
      brandName: product.brand.name,
      brandId: product.brand.brandId
    }))

    // Log the activity
    await prisma.userActivity.create({
      data: {
        userId,
        action: "EXPORT_PRODUCTS",
        details: brandId 
          ? `Exported products for brand ${brandId}`
          : "Exported all products",
        metadata: {
          brandId: brandId || null,
          exportedCount: products.length
        }
      }
    })

    return NextResponse.json({
      success: true,
      products: formattedProducts
    })
  } catch (error) {
    console.error("Error exporting products:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 