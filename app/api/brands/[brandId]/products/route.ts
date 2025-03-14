import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs"
import { db } from "@/lib/db"
import { z } from "zod"

const createProductSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().optional(),
  price: z.number().min(0),
  imageUrl: z.string().url().optional(),
  shopifyId: z.string()
})

export async function POST(
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
    
    const validatedData = createProductSchema.safeParse(body)
    if (!validatedData.success) {
      return new NextResponse(JSON.stringify({ 
        error: validatedData.error.issues[0].message 
      }), { status: 400 })
    }

    // Get the brand
    const brand = await db.brand.findFirst({
      where: {
        OR: [
          { id: brandId },
          { brandId: brandId }
        ]
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

    if (brand.userId !== userId && user?.role !== "SUPERADMIN") {
      return new NextResponse("Forbidden", { status: 403 })
    }

    // Check if brand is approved
    if (!brand.isApproved) {
      return new NextResponse("Brand must be approved before adding products", { status: 400 })
    }

    // Create the product
    const { title, description, price, imageUrl, shopifyId } = validatedData.data
    const product = await db.product.create({
      data: {
        title,
        description,
        price,
        imageUrl,
        shopifyId,
        brandId: brand.id,
        isHidden: !brand.isApproved // Hide product if brand is not approved
      }
    })

    // Log the activity
    await db.userActivity.create({
      data: {
        userId,
        type: "PRODUCT_CREATE",
        details: JSON.stringify({
          productId: product.id,
          productTitle: product.title,
          brandId: brand.id
        })
      }
    })

    return NextResponse.json({ success: true, product })
  } catch (error) {
    console.error("[PRODUCT_CREATE_ERROR]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function GET(
  req: Request,
  { params }: { params: { brandId: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { brandId } = params
    const { searchParams } = new URL(req.url)
    const includeHidden = searchParams.get("includeHidden") === "true"

    // Get the brand
    const brand = await db.brand.findFirst({
      where: {
        OR: [
          { id: brandId },
          { brandId: brandId }
        ]
      }
    })

    if (!brand) {
      return new NextResponse("Brand not found", { status: 404 })
    }

    // Check if user has permission to see hidden products
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    const canSeeHidden = user?.role === "SUPERADMIN" || 
                        user?.role === "PLATFORMADMIN" || 
                        brand.userId === userId

    // Get products
    const products = await db.product.findMany({
      where: {
        brandId: brand.id,
        isDeleted: false,
        ...((!canSeeHidden || !includeHidden) && { isHidden: false })
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ 
      success: true, 
      products,
      total: products.length
    })
  } catch (error) {
    console.error("[PRODUCT_LIST_ERROR]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 