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

    if (user?.role !== "SUPERADMIN" && user?.role !== "PLATFORMADMIN") {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const { brandId } = params
    const body = await req.json()
    const { action, reason } = body

    if (!action || (action === "reject" && !reason)) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

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

    // Update brand approval status
    await db.brand.update({
      where: { id: brand.id },
      data: {
        isApproved: action === "approve",
        isHidden: action !== "approve",
        approvalInfo: {
          create: {
            status: action === "approve" ? "approved" : "rejected",
            reason: action === "reject" ? reason : null,
            adminEmail: userId
          }
        }
      }
    })

    // If rejected, hide all products
    if (action === "reject") {
      await db.product.updateMany({
        where: { brandId: brand.id },
        data: { isHidden: true }
      })
    }

    // Log the activity
    await db.userActivity.create({
      data: {
        userId,
        type: action === "approve" ? "BRAND_APPROVED" : "BRAND_REJECTED",
        details: JSON.stringify({
          brandId: brand.id,
          brandName: brand.name,
          reason: action === "reject" ? reason : undefined
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[BRAND_APPROVAL_ERROR]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 