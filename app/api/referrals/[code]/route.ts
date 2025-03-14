import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs"
import prisma from "@/lib/prisma"

export async function DELETE(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const { userId } = auth()

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const referralLink = await prisma.referralLink.findUnique({
      where: {
        code: params.code,
        userId
      }
    })

    if (!referralLink) {
      return new NextResponse("Referral link not found", { status: 404 })
    }

    await prisma.referralLink.delete({
      where: {
        code: params.code,
        userId
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[REFERRAL_DELETE]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 