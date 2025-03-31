import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { checkBrandAccess } from "@/lib/brand-access"
import { z } from "zod"

const addAccessSchema = z.object({
  email: z.string().email(),
  role: z.enum(["owner", "manager"])
})

export async function GET(
  request: NextRequest,
  { params }: { params: { brandId: string } }
) {
  try {
    const result = await checkBrandAccess(params.brandId)
    if (!result.isAuthorized || !result.brand) {
      return NextResponse.json(
        { error: result.error || "Access denied" },
        { status: result.status || 403 }
      )
    }

    const access = await db.brandAccess.findMany({
      where: { brandId: result.brand.brandId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json(access)
  } catch (error) {
    console.error("[BRAND_ACCESS_GET]", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { brandId: string } }
) {
  try {
    const userEmail = request.headers.get("user-email")
    if (!userEmail) {
      return NextResponse.json(
        { error: "User email not provided" },
        { status: 401 }
      )
    }

    const result = await checkBrandAccess(params.brandId)
    if (!result.isAuthorized || !result.brand) {
      return NextResponse.json(
        { error: result.error || "Access denied" },
        { status: result.status || 403 }
      )
    }

    const body = addAccessSchema.parse(await request.json())

    // Only owners and admins can add managers
    const userAccess = result.brand.access.find(access => access.user.email === userEmail)
    const isOwner = userAccess?.role === "owner"
    const isAdmin = result.user?.role === "superAdmin" || result.user?.role === "platformAdmin"

    if (!isOwner) {
      return NextResponse.json(
        { error: "Only owners can add managers" },
        { status: 403 }
      )
    }

    // Find user
    const user = await db.user.findUnique({
      where: { email: body.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Check if user already has access
    const existingAccess = await db.brandAccess.findUnique({
      where: {
        userId_brandId: {
          userId: user.id,
          brandId: result.brand.brandId
        }
      }
    })

    if (existingAccess) {
      return NextResponse.json(
        { error: "User already has access to this brand" },
        { status: 400 }
      )
    }

    // Add brand access
    const brandAccess = await db.brandAccess.create({
      data: {
        role: body.role,
        userId: user.id,
        brandId: result.brand.brandId
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
    })

    return NextResponse.json(brandAccess)
  } catch (error) {
    console.error("[BRAND_ACCESS_POST]", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { brandId: string } }
) {
  try {
    const userEmail = request.headers.get("user-email")
    if (!userEmail) {
      return NextResponse.json(
        { error: "User email not provided" },
        { status: 401 }
      )
    }

    const result = await checkBrandAccess(params.brandId)
    if (!result.isAuthorized || !result.brand) {
      return NextResponse.json(
        { error: result.error || "Access denied" },
        { status: result.status || 403 }
      )
    }

    const { email } = await request.json()

    // Only owners can remove team members
    const userAccess = result.brand.access.find(access => access.user.email === userEmail)
    const isOwner = userAccess?.role === "owner"

    if (!isOwner) {
      return NextResponse.json(
        { error: "Only owners can remove team members" },
        { status: 403 }
      )
    }

    // Find the user to remove
    const userToRemove = await db.user.findUnique({
      where: { email }
    })

    if (!userToRemove) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Find their access record
    const accessToRemove = await db.brandAccess.findUnique({
      where: {
        userId_brandId: {
          userId: userToRemove.id,
          brandId: result.brand.brandId
        }
      }
    })

    if (!accessToRemove) {
      return NextResponse.json(
        { error: "User does not have access to this brand" },
        { status: 404 }
      )
    }

    // Cannot remove owner
    if (accessToRemove.role === "owner") {
      return NextResponse.json(
        { error: "Cannot remove the brand owner" },
        { status: 400 }
      )
    }

    // Remove the access
    await db.brandAccess.delete({
      where: {
        userId_brandId: {
          userId: userToRemove.id,
          brandId: result.brand.brandId
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[BRAND_ACCESS_DELETE]", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 