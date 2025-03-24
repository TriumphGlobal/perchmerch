import { auth } from "@clerk/nextjs"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function DELETE(
  req: Request,
  { params }: { params: { linkId: string } }
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

    await prisma.genreLink.delete({
      where: {
        id: params.linkId
      }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[GENRE_LINK_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 