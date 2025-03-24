import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  req: Request,
  { params }: { params: { brandId: string; genreId: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Verify brand ownership
    const brand = await prisma.brand.findUnique({
      where: { brandId: params.brandId },
      include: { owner: true }
    })

    if (!brand || !brand.owner || brand.owner.email !== userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Remove genre from brand
    await prisma.brand.update({
      where: { id: brand.id },
      data: {
        genres: {
          disconnect: { id: params.genreId }
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[BRAND_GENRE_DELETE]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 