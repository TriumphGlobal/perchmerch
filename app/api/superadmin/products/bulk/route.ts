import { auth } from "@clerk/nextjs"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const variantSchema = z.object({
  title: z.string(),
  price: z.number().min(0),
  sku: z.string().optional(),
  inventory: z.number().min(0).optional()
})

const productSchema = z.object({
  shopifyId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  price: z.number().min(0),
  imageUrl: z.string().url().optional(),
  variants: z.array(variantSchema).optional()
})

const requestSchema = z.object({
  products: z.array(productSchema),
  brandId: z.string()
})

export async function POST(request: Request) {
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
    const { products, brandId } = requestSchema.parse(body)

    // Verify brand exists and user has access
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
      select: { id: true }
    })

    if (!brand) {
      return NextResponse.json(
        { error: "Brand not found" },
        { status: 404 }
      )
    }

    const errors: string[] = []
    const importedProducts = []

    // Process each product in a transaction
    for (const product of products) {
      try {
        const result = await prisma.$transaction(async (tx) => {
          // Check if product already exists
          const existing = await tx.product.findUnique({
            where: { shopifyId: product.shopifyId }
          })

          if (existing) {
            // Update existing product
            const updated = await tx.product.update({
              where: { id: existing.id },
              data: {
                title: product.title,
                description: product.description,
                price: product.price,
                imageUrl: product.imageUrl
              }
            })
            return updated
          } else {
            // Create new product
            const created = await tx.product.create({
              data: {
                shopifyId: product.shopifyId,
                title: product.title,
                description: product.description,
                price: product.price,
                imageUrl: product.imageUrl,
                brandId: brandId
              }
            })
            return created
          }
        })

        importedProducts.push(result)
      } catch (error) {
        console.error(`Error processing product ${product.shopifyId}:`, error)
        errors.push(`Failed to import product ${product.title}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Log the activity
    await prisma.userActivity.create({
      data: {
        userId,
        action: "BULK_IMPORT_PRODUCTS",
        details: `Imported ${importedProducts.length} products for brand ${brandId}`,
        metadata: {
          brandId,
          importedCount: importedProducts.length,
          errorCount: errors.length
        }
      }
    })

    return NextResponse.json({
      success: true,
      imported: importedProducts.length,
      errors
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error importing products:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 