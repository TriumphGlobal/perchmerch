import { auth } from "@clerk/nextjs"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(
  req: Request,
  { params }: { params: { brandId: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Get user from local DB to check role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    if (user?.role !== "admin" && user?.role !== "superAdmin") {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const body = await req.json()
    const { approve } = body

    const brand = await prisma.brand.update({
      where: {
        id: params.brandId
      },
      data: {
        isApproved: approve,
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
    console.error("[BRAND_APPROVE_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 