import { auth } from "@clerk/nextjs"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateSchema = z.object({
  baseRate: z.number().min(0).max(1)
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

    const commission = await prisma.genreCommission.update({
      where: { id: params.commissionId },
      data: validatedData,
      include: {
        genre: {
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
        action: "UPDATE_GENRE_COMMISSION",
        details: `Updated commission rate for genre ${commission.genre.name}`,
        metadata: {
          genreId: commission.genreId,
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

    console.error("Error updating genre commission:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 