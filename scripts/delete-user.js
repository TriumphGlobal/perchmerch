const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function deleteUser(email) {
  try {
    await prisma.user.delete({
      where: { email }
    })
    console.log(`User ${email} deleted successfully`)
  } catch (error) {
    console.error('Error deleting user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

const email = process.argv[2]
if (!email) {
  console.error('Please provide an email address')
  process.exit(1)
}

deleteUser(email) 