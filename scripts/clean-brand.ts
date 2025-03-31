const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function cleanBrand() {
  try {
    console.log('Starting cleanup...')

    // With cascade delete enabled, we only need to delete the brand
    const deletedBrand = await prisma.brand.delete({
      where: {
        brandId: 'LQDog'
      }
    })
    console.log('Deleted brand:', deletedBrand.name)

    console.log('Cleanup completed successfully')
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanBrand() 