import { NextResponse } from "next/server"
import { checkBrandAccess } from "@/lib/brand-access"
import { db } from "@/lib/db"
import { z } from "zod"

const updateAccessSchema = z.object({
  role: z.enum(["owner", "manager"])
})

export async function PATCH(
  req: Request,
  { params }: { params: { brandId: string; userId: string } }
) {
  try {
    // Check if current user has access to manage the brand
    const result = await checkBrandAccess(params.brandId)
    if (!result.isAuthorized) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    // Only owners can modify team members
    const userAccess = result.brand.access.find(access => 
      access.user.email === result.user.email
    )
    if (userAccess?.role !== "owner" && result.user.role !== "superAdmin") {
      return NextResponse.json({ error: "Only owners can modify team members" }, { status: 403 })
    }

    const json = await req.json()
    const body = updateAccessSchema.parse(json)

    // If changing to owner, we need to handle ownership transfer
    if (body.role === "owner") {
      // First check if there's an existing owner
      const currentOwner = await db.brandAccess.findFirst({
        where: {
          brandId: result.brand.id,
          role: "owner"
        }
      })

      if (currentOwner) {
        // Change current owner to manager
        await db.brandAccess.update({
          where: {
            userId_brandId: {
              userId: currentOwner.userId,
              brandId: result.brand.id
            }
          },
          data: {
            role: "manager"
          }
        })
      }
    }

    // Update brand access for the target user
    const updatedAccess = await db.brandAccess.update({
      where: {
        userId_brandId: {
          userId: params.userId,
          brandId: result.brand.id
        }
      },
      data: {
        role: body.role
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

    return NextResponse.json(updatedAccess)
  } catch (error) {
    console.error("[BRAND_ACCESS_PATCH]", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { brandId: string; userId: string } }
) {
  try {
    // Check if current user has access to manage the brand
    const result = await checkBrandAccess(params.brandId)
    if (!result.isAuthorized) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    // Only owners can remove team members
    const userAccess = result.brand.access.find(access => 
      access.user.email === result.user.email
    )
    if (userAccess?.role !== "owner" && result.user.role !== "superAdmin") {
      return NextResponse.json({ error: "Only owners can remove team members" }, { status: 403 })
    }

    // Check if trying to remove the last owner
    const isLastOwner = (await db.brandAccess.count({
      where: {
        brandId: result.brand.id,
        role: "owner"
      }
    })) === 1 && userAccess?.role === "owner"

    if (isLastOwner) {
      return NextResponse.json({ error: "Cannot remove the last owner" }, { status: 400 })
    }

    // Delete brand access
    await db.brandAccess.delete({
      where: {
        userId_brandId: {
          userId: params.userId,
          brandId: result.brand.id
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[BRAND_ACCESS_DELETE]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 