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

    // Check if user is superadmin
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    if (user?.role !== "SUPERADMIN") {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const { brandId } = params

    // Get the brand
    const brand = await db.brand.findFirst({
      where: {
        OR: [
          { id: brandId },
          { brandId: brandId }
        ],
        isDeleted: true
      }
    })

    if (!brand) {
      return new NextResponse("Brand not found or not deleted", { status: 404 })
    }

    // Restore the brand
    await db.brand.update({
      where: { id: brand.id },
      data: {
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
        // If there's an original owner, restore ownership
        userId: brand.originalUserId || brand.userId,
        originalUserId: null
      }
    })

    // Restore visibility of products
    await db.product.updateMany({
      where: { brandId: brand.id },
      data: { isHidden: false }
    })

    // Log the activity
    await db.userActivity.create({
      data: {
        userId,
        type: "BRAND_RESTORED",
        details: JSON.stringify({
          brandId: brand.id,
          brandName: brand.name,
          restoredTo: brand.originalUserId || brand.userId
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[BRAND_RESTORE_ERROR]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 