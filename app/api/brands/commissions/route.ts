"use server"

import { auth } from "@clerk/nextjs"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
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

    const brands = await prisma.brand.findMany({
      select: {
        id: true,
        name: true,
        brandId: true,
        commissionRate: true,
        financials: {
          select: {
            totalSales: true
          }
        },
        lastModifiedAt: true,
        lastModifiedBy: {
          select: {
            email: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    const formattedBrands = brands.map(brand => ({
      id: brand.id,
      name: brand.name,
      brandId: brand.brandId,
      commissionRate: brand.commissionRate || 50, // Default to 50% if not set
      totalSales: brand.financials?.totalSales || 0,
      lastModified: brand.lastModifiedAt,
      lastModifiedBy: brand.lastModifiedBy
    }))

    return NextResponse.json(formattedBrands)
  } catch (error) {
    console.error("[BRANDS_COMMISSIONS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 