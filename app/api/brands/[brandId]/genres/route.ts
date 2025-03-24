import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: Request,
  { params }: { params: { brandId: string } }
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

    const { genreId } = await req.json()

    // Add genre to brand
    await prisma.brand.update({
      where: { id: brand.id },
      data: {
        genres: {
          connect: { id: genreId }
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[BRAND_GENRE_POST]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 