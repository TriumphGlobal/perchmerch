import { NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser?.emailAddresses?.[0]?.emailAddress) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userEmail = clerkUser.emailAddresses[0].emailAddress

    // Get user from database
    const user = await db.user.findUnique({
      where: { email: userEmail }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Only platform moderators and superAdmins can view pending brands
    if (!["platformModerator", "superAdmin"].includes(user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    // Get all pending brands
    const brands = await db.brand.findMany({
      where: {
        isApproved: false,
        isDeleted: false
      },
      include: {
        access: {
          where: {
            role: "owner"
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Format the response to match the expected interface
    const formattedBrands = brands.map(brand => ({
      id: brand.id,
      name: brand.name,
      description: brand.description,
      tagline: brand.tagline,
      imageUrl: brand.imageUrl,
      brandId: brand.brandId,
      isApproved: brand.isApproved,
      isHidden: brand.isHidden,
      createdAt: brand.createdAt.toISOString(),
      owner: brand.access[0]?.user || {
        id: "",
        email: "Unknown",
        name: null
      }
    }))

    return NextResponse.json({ brands: formattedBrands })
  } catch (error) {
    console.error("[BRANDS_PENDING]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 