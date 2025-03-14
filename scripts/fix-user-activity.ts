import { db } from '@/lib/db'

async function fixUserActivity() {
  try {
    const result = await db.userActivity.updateMany({
      where: {
        type: 'SUPERADMIN_CREATED'
      },
      data: {
        details: JSON.stringify({
          email: "sales@triumphglobal.net",
          timestamp: new Date().toISOString(),
          role: "superAdmin",
          privileges: {
            isPlatformAdmin: true,
            isSuperAdmin: true
          }
        })
      }
    })

    console.log('Updated records:', result.count)
  } catch (error) {
    console.error('Error fixing user activity:', error)
  } finally {
    await db.$disconnect()
  }
}

fixUserActivity() 