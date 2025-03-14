import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs"
import { db } from "@/lib/db"

// Soft delete a brand
export async function DELETE(
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

    // Get the brand's current data before soft deleting - check both id and brandId fields
    const brand = await db.brand.findFirst({
      where: {
        OR: [
          { id: brandId },
          { brandId: brandId }
        ]
      },
      select: {
        id: true,
        name: true,
        userId: true,
        brandId: true
      }
    })

    if (!brand) {
      return new NextResponse("Brand not found", { status: 404 })
    }

    // Soft delete the brand by marking it as deleted and storing deletion metadata
    await db.brand.update({
      where: { id: brand.id }, // Use the actual id from the found brand
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId,
        originalUserId: brand.userId
      }
    })

    // Hide any products
    await db.product.updateMany({
      where: { brandId: brand.id },
      data: { isHidden: true }
    })

    // Remove from featured brands
    await db.featuredBrand.deleteMany({
      where: { brandId: brand.id }
    })

    // Log the activity
    await db.userActivity.create({
      data: {
        userId,
        type: "BRAND_SOFT_DELETE",
        details: JSON.stringify({ 
          brandId: brand.id,
          brandName: brand.name,
          originalUserId: brand.userId
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[BRAND_DELETE_ERROR]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

// Restore a soft-deleted brand
export async function PATCH(
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
    const body = await req.json()
    const { newUserId } = body

    // Get the deleted brand
    const brand = await db.brand.findUnique({
      where: { id: brandId },
      select: {
        id: true,
        name: true,
        originalUserId: true,
        isDeleted: true
      }
    })

    if (!brand) {
      return new NextResponse("Brand not found", { status: 404 })
    }

    if (!brand.isDeleted) {
      return new NextResponse("Brand is not deleted", { status: 400 })
    }

    // If newUserId is provided, verify the user exists
    if (newUserId) {
      const newUser = await db.user.findUnique({
        where: { id: newUserId }
      })

      if (!newUser) {
        return new NextResponse("New owner not found", { status: 404 })
      }
    }

    // Restore the brand
    await db.brand.update({
      where: { id: brandId },
      data: {
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
        // Assign to new owner if specified, otherwise keep original owner
        userId: newUserId || brand.originalUserId,
        originalUserId: null
      }
    })

    // Unhide products
    await db.product.updateMany({
      where: { brandId },
      data: { isHidden: false }
    })

    // Log the activity
    await db.userActivity.create({
      data: {
        userId,
        type: "BRAND_RESTORE",
        details: JSON.stringify({ 
          brandId,
          brandName: brand.name,
          newUserId: newUserId || brand.originalUserId
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[BRAND_RESTORE_ERROR]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 