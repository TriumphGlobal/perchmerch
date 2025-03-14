import { auth } from "@clerk/nextjs"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const variantSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  price: z.number().min(0),
  sku: z.string().optional(),
  inventory: z.number().min(0),
  isHidden: z.boolean()
})

const updateSchema = z.object({
  variants: z.array(variantSchema)
})

export async function GET(
  request: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    if (!user || !["SUPERADMIN", "PLATFORMADMIN"].includes(user.role)) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    const variants = await prisma.productVariant.findMany({
      where: {
        productId: params.productId,
        isDeleted: false
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      variants
    })
  } catch (error) {
    console.error("Error fetching variants:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    if (!user || !["SUPERADMIN", "PLATFORMADMIN"].includes(user.role)) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { variants } = updateSchema.parse(body)

    // Start a transaction to handle variant updates
    const result = await prisma.$transaction(async (tx) => {
      // Get existing variants
      const existingVariants = await tx.productVariant.findMany({
        where: {
          productId: params.productId,
          isDeleted: false
        },
        select: { id: true }
      })

      // Create a set of existing IDs
      const existingIds = new Set(existingVariants.map(v => v.id))
      
      // Create a set of IDs from the request
      const updatedIds = new Set(variants.filter(v => v.id).map(v => v.id))

      // Find variants to delete (exist in DB but not in request)
      const toDelete = Array.from(existingIds).filter(id => !updatedIds.has(id))

      // Soft delete removed variants
      if (toDelete.length > 0) {
        await tx.productVariant.updateMany({
          where: {
            id: { in: toDelete }
          },
          data: {
            isDeleted: true,
            deletedAt: new Date(),
            deletedBy: userId
          }
        })
      }

      // Update or create variants
      const updatedVariants = await Promise.all(
        variants.map(variant => {
          if (variant.id) {
            // Update existing variant
            return tx.productVariant.update({
              where: { id: variant.id },
              data: {
                title: variant.title,
                price: variant.price,
                sku: variant.sku,
                inventory: variant.inventory,
                isHidden: variant.isHidden
              }
            })
          } else {
            // Create new variant
            return tx.productVariant.create({
              data: {
                productId: params.productId,
                title: variant.title,
                price: variant.price,
                sku: variant.sku,
                inventory: variant.inventory,
                isHidden: variant.isHidden
              }
            })
          }
        })
      )

      // Log the activity
      await tx.userActivity.create({
        data: {
          userId,
          action: "UPDATE_PRODUCT_VARIANTS",
          details: `Updated variants for product ${params.productId}`,
          metadata: {
            productId: params.productId,
            updatedCount: variants.length,
            deletedCount: toDelete.length
          }
        }
      })

      return updatedVariants
    })

    return NextResponse.json({
      success: true,
      variants: result
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error updating variants:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 