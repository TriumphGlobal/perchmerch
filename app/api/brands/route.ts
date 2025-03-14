import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs"
import prisma from "@/lib/prisma"
import { sendEmail, emailTemplates } from "@/lib/email"

export async function POST(request: Request) {
  try {
    const { userId } = auth()

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await request.json()
    const { name, description, tagline, imageUrl, genreIds, socialMedia } = body

    // Get user's email
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    })

    if (!user?.email) {
      return new NextResponse("User email not found", { status: 400 })
    }

    // Create the brand
    const brand = await prisma.brand.create({
      data: {
        name,
        description,
        tagline,
        imageUrl,
        userId,
        status: "PENDING",
        socialMedia: socialMedia || {},
        genres: {
          connect: genreIds?.map(id => ({ id })) || []
        }
      }
    })

    // Send email notification
    const { subject, html } = emailTemplates.brandCreated(name)
    await sendEmail({
      to: user.email,
      subject,
      html
    })

    return NextResponse.json({ success: true, brand })
  } catch (error) {
    console.error("[BRAND_CREATE]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { userId } = auth()

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await request.json()
    const { brandId, status, reason } = body

    // Get brand and user info
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
      include: {
        user: {
          select: { email: true }
        }
      }
    })

    if (!brand) {
      return new NextResponse("Brand not found", { status: 404 })
    }

    // Update brand status
    const updatedBrand = await prisma.brand.update({
      where: { id: brandId },
      data: { status }
    })

    // Send email notification if user has email
    if (brand.user?.email) {
      const { subject, html } = emailTemplates.brandStatusChanged(brand.name, status, reason)
      await sendEmail({
        to: brand.user.email,
        subject,
        html
      })
    }

    return NextResponse.json({ success: true, brand: updatedBrand })
  } catch (error) {
    console.error("[BRAND_UPDATE]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 