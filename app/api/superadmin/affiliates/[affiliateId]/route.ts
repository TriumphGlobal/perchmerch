import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs"
import { db } from "@/lib/db"
import { z } from "zod"

const actionSchema = z.object({
  action: z.enum(["approve", "reject", "ban", "unban"]),
  reason: z.string().optional(),
  banDuration: z.number().optional() // Duration in days
})

export async function POST(
  req: Request,
  { params }: { params: { affiliateId: string } }
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

    const { affiliateId } = params
    const body = await req.json()
    const validatedData = actionSchema.safeParse(body)

    if (!validatedData.success) {
      return new NextResponse(JSON.stringify({ 
        error: validatedData.error.issues[0].message 
      }), { status: 400 })
    }

    const { action, reason, banDuration = 7 } = validatedData.data

    // Get the affiliate
    const affiliate = await db.affiliate.findUnique({
      where: { id: affiliateId },
      include: {
        user: {
          select: {
            email: true
          }
        },
        brand: {
          select: {
            name: true
          }
        }
      }
    })

    if (!affiliate) {
      return new NextResponse("Affiliate not found", { status: 404 })
    }

    let updateData = {}
    let activityType = ""

    switch (action) {
      case "approve":
        if (affiliate.status !== "PENDING") {
          return new NextResponse("Can only approve pending affiliates", { status: 400 })
        }
        updateData = {
          status: "APPROVED",
          approvedAt: new Date(),
          approvedBy: userId
        }
        activityType = "AFFILIATE_APPROVE"
        break

      case "reject":
        if (affiliate.status !== "PENDING") {
          return new NextResponse("Can only reject pending affiliates", { status: 400 })
        }
        if (!reason) {
          return new NextResponse("Rejection reason is required", { status: 400 })
        }
        updateData = {
          status: "REJECTED",
          rejectedAt: new Date(),
          rejectedBy: userId,
          rejectionReason: reason
        }
        activityType = "AFFILIATE_REJECT"
        break

      case "ban":
        if (affiliate.status === "BANNED") {
          return new NextResponse("Affiliate is already banned", { status: 400 })
        }
        if (!reason) {
          return new NextResponse("Ban reason is required", { status: 400 })
        }
        updateData = {
          status: "BANNED",
          bannedAt: new Date(),
          bannedBy: userId,
          banReason: reason,
          banExpiresAt: new Date(Date.now() + banDuration * 24 * 60 * 60 * 1000)
        }
        activityType = "AFFILIATE_BAN"
        break

      case "unban":
        if (affiliate.status !== "BANNED") {
          return new NextResponse("Affiliate is not banned", { status: 400 })
        }
        updateData = {
          status: "APPROVED",
          bannedAt: null,
          bannedBy: null,
          banReason: null,
          banExpiresAt: null
        }
        activityType = "AFFILIATE_UNBAN"
        break
    }

    // Update the affiliate
    await db.affiliate.update({
      where: { id: affiliateId },
      data: updateData
    })

    // Log the activity
    await db.userActivity.create({
      data: {
        userId,
        type: activityType,
        details: JSON.stringify({
          affiliateId: affiliate.id,
          affiliateEmail: affiliate.user.email,
          brandName: affiliate.brand.name,
          action,
          reason,
          banDuration
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[AFFILIATE_ACTION_ERROR]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { affiliateId: string } }
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

    const { affiliateId } = params
    const body = await req.json()
    const { commissionRate } = body

    if (typeof commissionRate !== "number" || commissionRate < 0 || commissionRate > 1) {
      return new NextResponse("Invalid commission rate", { status: 400 })
    }

    // Get the affiliate
    const affiliate = await db.affiliate.findUnique({
      where: { id: affiliateId }
    })

    if (!affiliate) {
      return new NextResponse("Affiliate not found", { status: 404 })
    }

    // Update the commission rate
    await db.affiliate.update({
      where: { id: affiliateId },
      data: {
        commissionRate
      }
    })

    // Log the activity
    await db.userActivity.create({
      data: {
        userId,
        type: "AFFILIATE_UPDATE",
        details: JSON.stringify({
          affiliateId,
          changes: {
            commissionRate: {
              from: affiliate.commissionRate,
              to: commissionRate
            }
          }
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[AFFILIATE_UPDATE_ERROR]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 