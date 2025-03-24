const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function cleanupBrand(brandId: string) {
  try {
    // Delete all related records in order of dependencies
    await prisma.$transaction([
      // Delete brand access records
      prisma.brandAccess.deleteMany({
        where: { brandId }
      }),
      // Delete brand social media
      prisma.brandSocialMedia.deleteMany({
        where: { brandId }
      }),
      // Delete brand genres
      prisma.brandGenre.deleteMany({
        where: { brandId }
      }),
      // Delete brand commission
      prisma.brandCommission.deleteMany({
        where: { brandId }
      }),
      // Delete featured brand records
      prisma.featuredBrand.deleteMany({
        where: { brandId }
      }),
      // Delete brand approvals
      prisma.brandApproval.deleteMany({
        where: { brandId }
      }),
      // Delete temporary bans
      prisma.temporaryBan.deleteMany({
        where: { brandId }
      }),
      // Delete product variants first
      prisma.productVariant.deleteMany({
        where: {
          product: {
            brandId
          }
        }
      }),
      // Delete products
      prisma.product.deleteMany({
        where: { brandId }
      }),
      // Delete orders
      prisma.order.deleteMany({
        where: { brandId }
      }),
      // Delete affiliates
      prisma.affiliate.deleteMany({
        where: { brandId }
      }),
      // Finally delete the brand
      prisma.brand.delete({
        where: { id: brandId }
      }),
      // Remove all brand-genre relationships
      prisma.brand.update({
        where: { id: brandId },
        data: {
          genres: {
            set: []
          }
        }
      })
    ])

    console.log('Successfully deleted brand and all related records')
  } catch (error) {
    console.error('Error deleting brand:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Get the brand ID from command line argument
const brandId = process.argv[2]
if (!brandId) {
  console.error('Please provide a brand ID')
  process.exit(1)
}

cleanupBrand(brandId) 