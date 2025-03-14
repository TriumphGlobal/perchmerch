import { auth } from "@clerk/nextjs"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateSchema = z.object({
  baseRate: z.number().min(0).max(1).optional(),
  minRate: z.number().min(0).max(1).optional(),
  maxRate: z.number().min(0).max(1).optional(),
  isAutomatic: z.boolean().optional()
})

export async function PATCH(
  request: Request,
  { params }: { params: { commissionId: string } }
) {
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

    const body = await request.json()
    const validatedData = updateSchema.parse(body)

    const commission = await prisma.brandCommission.update({
      where: { id: params.commissionId },
      data: validatedData,
      include: {
        brand: {
          select: {
            name: true
          }
        }
      }
    })

    // Log the activity
    await prisma.userActivity.create({
      data: {
        userId,
        action: "UPDATE_COMMISSION",
        details: `Updated commission settings for brand ${commission.brand.name}`,
        metadata: {
          brandId: commission.brandId,
          updates: validatedData
        }
      }
    })

    return NextResponse.json({
      success: true,
      commission
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error updating brand commission:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 