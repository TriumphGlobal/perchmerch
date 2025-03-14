import { PrismaClient } from '@prisma/client'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function GET(req: Request) {
  try {
    // Get authentication info
    const { userId } = await auth()
    
    if (!userId) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }
    
    // Check if user is an admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        role: true, 
        isPlatformAdmin: true, 
        isSuperAdmin: true 
      }
    })
    
    if (!user || !(user.isPlatformAdmin || user.isSuperAdmin)) {
      return new NextResponse(JSON.stringify({ 
        error: 'Forbidden', 
        userRole: user?.role || 'user',
        isAdmin: !!(user?.isPlatformAdmin || user?.isSuperAdmin)
      }), { status: 403 })
    }
    
    console.log("Admin user fetching brands:", user.id)
    
    // Get all brands with complete information
    const brands = await prisma.brand.findMany({
      select: {
        id: true,
        name: true,
        brandId: true,
        isApproved: true,
        isFeatured: true,
        isDeleted: true,
        totalSales: true,
        totalEarnings: true,
        createdAt: true,
        deletedAt: true,
        deletedBy: true,
        originalUserId: true,
        userId: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        products: {
          select: {
            id: true,
            isHidden: true
          }
        },
        featuredInfo: {
          select: {
            id: true,
            startDate: true,
            endDate: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    console.log(`Found ${brands.length} brands`)
    
    // Transform data for frontend
    const transformedBrands = brands.map(brand => ({
      id: brand.id,
      name: brand.name,
      brandId: brand.brandId,
      isApproved: brand.isApproved,
      isFeatured: brand.isFeatured,
      isDeleted: brand.isDeleted,
      totalSales: brand.totalSales,
      totalEarnings: brand.totalEarnings,
      createdAt: brand.createdAt,
      deletedAt: brand.deletedAt,
      deletedBy: brand.deletedBy,
      originalUserId: brand.originalUserId,
      owner: brand.user,
      productCount: brand.products.length,
      hiddenProductCount: brand.products.filter(p => p.isHidden).length,
      featuredUntil: brand.featuredInfo[0]?.endDate || null
    }))
    
    return new NextResponse(JSON.stringify({ 
      success: true,
      brands: transformedBrands,
      total: transformedBrands.length
    }), { status: 200 })
  } catch (error) {
    console.error('Error fetching brands for admin:', error)
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 })
  }
} 