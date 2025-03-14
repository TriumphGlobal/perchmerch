import { auth } from "@clerk/nextjs"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Get user's affiliate links
    const affiliateLinks = await prisma.affiliate.findMany({
      where: {
        userId,
        status: "APPROVED",
      },
      include: {
        brand: {
          select: {
            name: true
          }
        }
      }
    })

    // Format the response
    const formattedLinks = affiliateLinks.map(link => ({
      id: link.id,
      brandId: link.brandId,
      brandName: link.brand.name,
      status: link.status,
      commissionRate: link.commissionRate,
      totalSales: link.totalSales,
      totalDue: link.totalDue,
      totalPaid: link.totalPaid,
      clickCount: link.clickCount,
      conversionRate: link.conversionRate
    }))

    return NextResponse.json(formattedLinks)
  } catch (error) {
    console.error("[AFFILIATE_LINKS_ERROR]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 