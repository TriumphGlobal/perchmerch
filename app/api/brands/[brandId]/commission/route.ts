"use server"

import { auth } from "@clerk/nextjs"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function PATCH(
  req: Request,
  { params }: { params: { brandId: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    if (user?.role !== "superAdmin") {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const body = await req.json()
    const { commissionRate } = body

    if (typeof commissionRate !== "number" || commissionRate < 50 || commissionRate > 80) {
      return new NextResponse("Invalid commission rate. Must be between 50 and 80", { status: 400 })
    }

    const brand = await prisma.brand.update({
      where: {
        id: params.brandId
      },
      data: {
        commissionRate: commissionRate,
        lastModifiedAt: new Date(),
        lastModifiedBy: {
          connect: {
            id: userId
          }
        }
      }
    })

    return NextResponse.json(brand)
  } catch (error) {
    console.error("[BRAND_COMMISSION_PATCH]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 