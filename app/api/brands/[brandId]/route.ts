import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(
  _request: Request,
  { params }: { params: { brandId: string } }
) {
  const brand = await db.brand.findUnique({
    where: {
      id: params.brandId,
    },
    select: {
      id: true,
      name: true,
      description: true,
      products: true,
      imageUrl: true,
      websiteUrl: true,
      twitterHandle: true,
      telegramUrl: true,
      customLinks: true,
      colors: true,
    },
  })

  if (!brand) {
    return NextResponse.json({ error: "Brand not found" }, { status: 404 })
  }

  return NextResponse.json(brand)
}