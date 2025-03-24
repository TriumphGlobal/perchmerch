import { NextRequest, NextResponse } from "next/server"
import { checkBrandAccess } from "@/lib/brand-access"
import { db } from "@/lib/db"
import { Prisma } from "@prisma/client"

export async function GET(
  request: NextRequest,
  { params }: { params: { brandId: string } }
) {
  try {
    const brandIdOrSlug = params.brandId
    const userEmail = request.headers.get("user-email")

    if (!userEmail) {
      return NextResponse.json(
        { error: "User email not provided" },
        { status: 401 }
      )
    }

    const result = await checkBrandAccess(brandIdOrSlug)

    if (!result.isAuthorized || !result.brand) {
      console.log("[BRAND_API] Access denied:", {
        brandIdOrSlug,
        userEmail,
        error: result.error
      })
      return NextResponse.json(
        { error: result.error || "Access denied" },
        { status: result.status || 403 }
      )
    }

    // Get the brand with all necessary relations
    const brand = await db.brand.findUnique({
      where: { id: result.brand.id },
      include: {
        access: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true
              }
            }
          }
        },
        _count: {
          select: {
            products: true
          }
        }
      }
    })

    if (!brand) {
      return NextResponse.json(
        { error: "Brand not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ brand })
  } catch (error) {
    console.error("[BRAND_API] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { brandId: string } }
) {
  try {
    console.log("[BRAND_DELETE] Checking access for brandId:", params.brandId)
    const result = await checkBrandAccess(params.brandId)

    if (!result.isAuthorized || !result.brand || !result.user) {
      return NextResponse.json({ error: result.error || "Unauthorized" }, { status: result.status || 403 })
    }

    // Only owners and admins can delete
    const userAccess = result.brand.access.find(access => access.user.email === result.user.email)
    const isOwner = userAccess?.role === "owner"
    const isAdmin = result.user.role === "platformModerator" || result.user.role === "superAdmin"

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Only owners and admins can delete brands" }, { status: 403 })
    }

    // Soft delete the brand
    await db.brand.update({
      where: { id: result.brand.id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: result.user.email,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[BRAND_DELETE]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { brandId: string } }
) {
  try {
    console.log("[BRAND_PATCH] Checking access for brandId:", params.brandId)
    const result = await checkBrandAccess(params.brandId)

    if (!result.isAuthorized || !result.brand || !result.user) {
      return NextResponse.json({ error: result.error || "Unauthorized" }, { status: result.status || 403 })
    }

    const body = await req.json()
    const { isApproved, isHidden, name, description, tagline, imageUrl, commissionRate, colors } = body

    // Only owners and admins can update
    const userAccess = result.brand.access.find(access => access.user.email === result.user.email)
    const isOwner = userAccess?.role === "owner"
    const isAdmin = result.user.role === "platformModerator" || result.user.role === "superAdmin"

    // Only allow approval/hidden status changes by admins
    if ((isApproved !== undefined || isHidden !== undefined) && !isAdmin) {
      return NextResponse.json({ error: "Only admins can change approval status" }, { status: 403 })
    }

    // Only allow other changes by owner or admins
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Only owners and admins can update brands" }, { status: 403 })
    }

    // Update the brand
    const updateData: Prisma.BrandUpdateInput = {
      ...(name && { name }),
      ...(description && { description }),
      ...(tagline && { tagline }),
      ...(imageUrl && { imageUrl }),
      ...(colors && { colors }),
      ...(typeof commissionRate !== 'undefined' && { commissionRate }),
      ...(typeof isApproved !== 'undefined' && { isApproved }),
      ...(typeof isHidden !== 'undefined' && { isHidden }),
      lastModifiedAt: new Date(),
      lastModifiedByEmail: result.user.email
    };

    const updatedBrand = await db.brand.update({
      where: {
        id: result.brand.id
      },
      data: updateData
    })

    return NextResponse.json({ brand: updatedBrand })
  } catch (error) {
    console.error("[BRAND_PATCH]", error)
    return NextResponse.json({ 
      error: "Failed to update brand",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}