import { auth } from "@clerk/nextjs"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const tierSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  minSales: z.number().min(0),
  rate: z.number().min(0).max(1)
})

const updateSchema = z.object({
  tiers: z.array(tierSchema)
})

export async function PUT(
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
    const { tiers } = updateSchema.parse(body)

    // Start a transaction to handle tier updates
    const result = await prisma.$transaction(async (tx) => {
      // Delete existing tiers
      await tx.commissionTier.deleteMany({
        where: { brandCommissionId: params.commissionId }
      })

      // Create new tiers
      const newTiers = await Promise.all(
        tiers.map(tier => 
          tx.commissionTier.create({
            data: {
              name: tier.name,
              minSales: tier.minSales,
              rate: tier.rate,
              brandCommissionId: params.commissionId
            }
          })
        )
      )

      // Get the brand name for activity logging
      const commission = await tx.brandCommission.findUnique({
        where: { id: params.commissionId },
        include: {
          brand: {
            select: { name: true }
          }
        }
      })

      // Log the activity
      await tx.userActivity.create({
        data: {
          userId,
          action: "UPDATE_COMMISSION_TIERS",
          details: `Updated commission tiers for brand ${commission?.brand.name}`,
          metadata: {
            brandId: commission?.brandId,
            tiers: tiers
          }
        }
      })

      return { tiers: newTiers, brandName: commission?.brand.name }
    })

    return NextResponse.json({
      success: true,
      tiers: result.tiers
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error updating commission tiers:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 