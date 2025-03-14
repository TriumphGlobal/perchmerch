import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs"

const PRINTIFY_API_KEY = process.env.PRINTIFY_API_KEY
const PRINTIFY_API_URL = "https://api.printify.com/v1"

interface PrintifyProduct {
  id: string
  title: string
  description: string
  images: string[]
  variants: Array<{
    id: string
    title: string
    price: number
  }>
}

export async function POST(req: Request) {
  try {
    // Check authentication
    const { userId } = auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Check if Printify API key is configured
    if (!PRINTIFY_API_KEY) {
      return new NextResponse("Printify API key not configured", { status: 500 })
    }

    // Get URL from request body
    const body = await req.json()
    const { url } = body

    if (!url) {
      return new NextResponse("Missing product URL", { status: 400 })
    }

    // Extract product ID from URL
    const productId = extractProductId(url)
    if (!productId) {
      return new NextResponse("Invalid Printify URL", { status: 400 })
    }

    // Fetch product from Printify
    const product = await fetchPrintifyProduct(productId)

    // Transform product data
    const transformedProduct = {
      title: product.title,
      description: product.description,
      price: product.variants[0]?.price || 0,
      image: product.images[0] || "",
    }

    return NextResponse.json(transformedProduct)
  } catch (error: any) {
    console.error("[PRINTIFY_PRODUCT_ERROR]", error)
    return new NextResponse(error.message || "Internal error", { status: 500 })
  }
}

function extractProductId(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split("/")
    return pathParts[pathParts.length - 1]
  } catch {
    return null
  }
}

async function fetchPrintifyProduct(productId: string): Promise<PrintifyProduct> {
  const response = await fetch(`${PRINTIFY_API_URL}/catalog/products/${productId}`, {
    headers: {
      "Authorization": `Bearer ${PRINTIFY_API_KEY}`,
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    throw new Error("Failed to fetch product from Printify")
  }

  return response.json()
} 