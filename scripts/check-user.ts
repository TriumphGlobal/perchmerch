import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findUnique({
    where: {
      email: 'sales@triumphglobal.net'
    }
  })
  
  console.log('Current user state:', JSON.stringify(user, null, 2))
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  }) 