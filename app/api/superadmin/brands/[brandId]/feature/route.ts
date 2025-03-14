import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs"
import { db } from "@/lib/db"

export async function POST(
  req: Request,
  { params }: { params: { brandId: string } }
) {
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

    if (user?.role !== "SUPERADMIN") {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const { brandId } = params
    const body = await req.json()
    const { isFeatured } = body

    // Get the brand
    const brand = await db.brand.findFirst({
      where: {
        OR: [
          { id: brandId },
          { brandId: brandId }
        ]
      }
    })

    if (!brand) {
      return new NextResponse("Brand not found", { status: 404 })
    }

    // Update featured status
    await db.brand.update({
      where: { id: brand.id },
      data: { 
        isFeatured,
        featuredInfo: isFeatured ? {
          create: {
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            featuredBy: userId
          }
        } : {
          deleteMany: {} // Remove all featured info when unfeaturing
        }
      }
    })

    // Log the activity
    await db.userActivity.create({
      data: {
        userId,
        type: isFeatured ? "BRAND_FEATURED" : "BRAND_UNFEATURED",
        details: JSON.stringify({
          brandId: brand.id,
          brandName: brand.name
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[BRAND_FEATURE_ERROR]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 