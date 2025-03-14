import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { db } from "@/lib/db"
import { auth } from "@clerk/nextjs"
import prisma from "@/lib/prisma"
import { sendEmail, emailTemplates } from "@/lib/email"

export async function GET(
  request: Request,
  { params }: { params: { productId: string } }
) {
  const headersList = headers()
  console.log(`[Product Details] Referer: ${headersList.get("referer")}`)

  const { productId } = params
  const { searchParams } = new URL(request.url)
  const brandId = searchParams.get("brandId")

  if (!productId || !brandId) {
    return NextResponse.json(
      { error: "Missing productId or brandId" },
      { status: 400 }
    )
  }

  try {
    const product = await db.product.findUnique({
      where: {
        id: productId,
        brandId: brandId
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        image: true,
        brandId: true,
        brand: {
          select: {
            name: true
          }
        }
      }
    })

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ...product,
      brandName: product.brand.name
    })
  } catch (error) {
    console.error("[Product Details] Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch product details" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const { userId } = auth()

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await request.json()
    const { status, reason } = body

    // Get product, brand and user info
    const product = await prisma.product.findUnique({
      where: { id: params.productId },
      include: {
        brand: {
          include: {
            user: {
              select: { email: true }
            }
          }
        }
      }
    })

    if (!product) {
      return new NextResponse("Product not found", { status: 404 })
    }

    // Update product status
    const updatedProduct = await prisma.product.update({
      where: { id: params.productId },
      data: { status }
    })

    // Send email notification if user has email
    if (product.brand.user?.email) {
      let emailTemplate
      switch (status) {
        case "REMOVED":
          emailTemplate = emailTemplates.productRemoved(product.brand.name, product.name, reason)
          break
        case "MODIFIED":
          emailTemplate = emailTemplates.productModified(product.brand.name, product.name)
          break
        default:
          emailTemplate = emailTemplates.productStatusChanged(product.brand.name, product.name, status, reason)
      }

      await sendEmail({
        to: product.brand.user.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html
      })
    }

    return NextResponse.json({ success: true, product: updatedProduct })
  } catch (error) {
    console.error("[PRODUCT_UPDATE]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const { userId } = auth()

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { reason } = await request.json()

    // Get product and user info before deletion
    const product = await prisma.product.findUnique({
      where: { id: params.productId },
      include: {
        brand: {
          include: {
            user: {
              select: { email: true }
            }
          }
        }
      }
    })

    if (!product) {
      return new NextResponse("Product not found", { status: 404 })
    }

    // Delete the product
    await prisma.product.delete({
      where: { id: params.productId }
    })

    // Send email notification
    if (product.brand.user?.email) {
      const { subject, html } = emailTemplates.productRemoved(
        product.brand.name,
        product.name,
        reason
      )

      await sendEmail({
        to: product.brand.user.email,
        subject,
        html
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[PRODUCT_DELETE]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 