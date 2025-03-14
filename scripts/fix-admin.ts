import { PrismaClient } from '@prisma/client'
import { hash } from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  // First, check if user exists
  const user = await prisma.user.findUnique({
    where: {
      email: 'sales@triumphglobal.net'
    }
  })

  const hashedPassword = await hash('password', 10)

  if (user) {
    // Update existing user
    const updatedUser = await prisma.user.update({
      where: {
        email: 'sales@triumphglobal.net'
      },
      data: {
        role: 'SUPERADMIN',
        isSuperAdmin: true,
        isPlatformAdmin: true,
        password: hashedPassword
      }
    })
    console.log('Updated user:', updatedUser)
  } else {
    // Create new user
    const newUser = await prisma.user.create({
      data: {
        id: 'clsuperadmin',
        email: 'sales@triumphglobal.net',
        name: 'PerchMerch Admin',
        role: 'SUPERADMIN',
        isSuperAdmin: true,
        isPlatformAdmin: true,
        password: hashedPassword
      }
    })
    console.log('Created user:', newUser)
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  }) 