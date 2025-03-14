import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs"
import { db } from "@/lib/db"

export async function PATCH(
  req: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Check if user is admin or brand owner
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    const { productId } = params
    const body = await req.json()
    const { isHidden, title, description, price } = body

    // Get the product with its brand
    const product = await db.product.findUnique({
      where: { id: productId },
      include: { brand: true }
    })

    if (!product) {
      return new NextResponse("Product not found", { status: 404 })
    }

    // Check if user has permission
    if (user?.role !== "SUPERADMIN" && user?.role !== "PLATFORMADMIN" && product.brand.userId !== userId) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    // Update the product
    const updatedProduct = await db.product.update({
      where: { id: productId },
      data: {
        isHidden: isHidden !== undefined ? isHidden : product.isHidden,
        title: title || product.title,
        description: description !== undefined ? description : product.description,
        price: price !== undefined ? price : product.price
      }
    })

    // Log the activity
    await db.userActivity.create({
      data: {
        userId,
        type: "PRODUCT_UPDATE",
        details: JSON.stringify({
          productId: product.id,
          changes: body
        })
      }
    })

    return NextResponse.json({ success: true, product: updatedProduct })
  } catch (error) {
    console.error("[PRODUCT_UPDATE_ERROR]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Check if user is admin or brand owner
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    const { productId } = params

    // Get the product with its brand
    const product = await db.product.findUnique({
      where: { id: productId },
      include: { brand: true }
    })

    if (!product) {
      return new NextResponse("Product not found", { status: 404 })
    }

    // Check if user has permission
    if (user?.role !== "SUPERADMIN" && user?.role !== "PLATFORMADMIN" && product.brand.userId !== userId) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    // Soft delete the product
    await db.product.update({
      where: { id: productId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId
      }
    })

    // Log the activity
    await db.userActivity.create({
      data: {
        userId,
        type: "PRODUCT_DELETE",
        details: JSON.stringify({
          productId: product.id,
          productTitle: product.title
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[PRODUCT_DELETE_ERROR]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 