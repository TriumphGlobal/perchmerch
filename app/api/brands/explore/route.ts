import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { db } from "@/lib/db"

export async function GET(request: Request) {
  const headersList = headers()
  console.log(`[Brand Explore] Referer: ${headersList.get("referer")}`)

  const { searchParams } = new URL(request.url)
  const sort = searchParams.get("sort") || "popular"
  const category = searchParams.get("category") || "All Categories"
  const featured = searchParams.get("featured") === "true"

  try {
    const brands = await db.brand.findMany({
      where: {
        isApproved: true,
        ...(featured && { isFeatured: true })
      },
      include: {
        products: true,
        affiliates: true
      },
      orderBy: sort === "newest" 
        ? { createdAt: "desc" }
        : { totalSales: "desc" }
    })

    // Transform the data
    const transformedBrands = brands.map(brand => ({
      id: brand.id,
      brandId: brand.id,
      name: brand.name,
      description: brand.description || "",
      imageUrl: brand.imageUrl || "",
      isApproved: brand.isApproved,
      isFeatured: brand.isFeatured,
      totalSales: brand.totalSales,
      metrics: {
        rating: 4.5, // TODO: Implement actual rating system
        productCount: brand.products.length,
        affiliateCount: brand.affiliates.length
      }
    }))

    return NextResponse.json({
      brands: transformedBrands
    })
  } catch (error) {
    console.error("[Brand Explore] Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch brands" },
      { status: 500 }
    )
  }
} 