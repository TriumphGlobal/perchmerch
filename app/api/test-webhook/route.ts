import { db } from '@/lib/db'

const SUPERADMIN_EMAIL = "sales@triumphglobal.net"

export async function GET(req: Request) {
  // URL parameters
  const url = new URL(req.url)
  const email = url.searchParams.get('email') || SUPERADMIN_EMAIL
  
  // Generate a unique ID (would come from Clerk in a real webhook)
  const id = `test_${Date.now()}`
  
  // Check if this is the first user or the superadmin email
  const userCount = await db.user.count()
  const isSuperAdmin = email === SUPERADMIN_EMAIL
  const shouldBeSuperAdmin = isSuperAdmin || userCount === 0

  try {
    // Create the user in our database
    const user = await db.user.create({
      data: {
        id: id,
        name: 'Test User',
        email: email,
        image: 'https://via.placeholder.com/150',
        role: shouldBeSuperAdmin ? "superAdmin" : "user",
        isPlatformAdmin: shouldBeSuperAdmin,
        isSuperAdmin: shouldBeSuperAdmin,
      }
    })

    // Log the activity
    await db.userActivity.create({
      data: {
        userId: id,
        type: shouldBeSuperAdmin ? "SUPERADMIN_CREATED" : "USER_CREATED",
        details: JSON.stringify({ email })
      }
    })

    console.log(`Test user created: ${id} (${email}) - ${shouldBeSuperAdmin ? 'SuperAdmin' : 'User'}`)
    return new Response(JSON.stringify({
      success: true,
      message: 'Test user created successfully',
      user
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error creating test user:', error)
    return new Response(JSON.stringify({
      success: false,
      error: String(error)
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
} 