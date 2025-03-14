import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Get featured brands ordered by creation date
    const featuredBrands = await prisma.featuredBrand.findMany({
      include: {
        brand: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Map to return only necessary data
    const brands = featuredBrands.map(fb => ({
      id: fb.id,
      brandId: fb.brand.brandId,
      name: fb.brand.name,
      startDate: fb.startDate,
      endDate: fb.endDate
    }))

    return new Response(JSON.stringify({
      success: true,
      brands
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error fetching featured brands:', error)
    return new Response(JSON.stringify({
      success: false,
      error: String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
} 