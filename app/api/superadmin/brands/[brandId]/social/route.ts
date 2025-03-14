import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs"
import { db } from "@/lib/db"
import { z } from "zod"

const socialMediaSchema = z.object({
  platform: z.enum(["facebook", "instagram", "twitter", "website"]),
  url: z.string().url()
})

export async function PATCH(
  req: Request,
  { params }: { params: { brandId: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { brandId } = params
    const body = await req.json()
    
    const validatedData = socialMediaSchema.safeParse(body)
    if (!validatedData.success) {
      return new NextResponse(JSON.stringify({ 
        error: validatedData.error.issues[0].message 
      }), { status: 400 })
    }

    // Get the brand
    const brand = await db.brand.findUnique({
      where: { id: brandId },
      include: {
        socialMedia: true
      }
    })

    if (!brand) {
      return new NextResponse("Brand not found", { status: 404 })
    }

    // Check if user owns the brand or is admin
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    if (brand.userId !== userId && user?.role !== "SUPERADMIN" && user?.role !== "PLATFORMADMIN") {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const { platform, url } = validatedData.data

    // Update or create social media links
    const socialMedia = await db.brandSocialMedia.upsert({
      where: {
        brandId
      },
      create: {
        brandId,
        [platform]: url
      },
      update: {
        [platform]: url
      }
    })

    // Log the activity
    await db.userActivity.create({
      data: {
        userId,
        type: "BRAND_SOCIAL_UPDATE",
        details: JSON.stringify({
          brandId,
          platform,
          url
        })
      }
    })

    return NextResponse.json({ success: true, socialMedia })
  } catch (error) {
    console.error("[BRAND_SOCIAL_UPDATE_ERROR]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 