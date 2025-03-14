import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"

export async function PUT(req: Request) {
  try {
    const session = await auth()
    if (!session || !session.userId) {
      return new Response("Unauthorized", { status: 401 })
    }

    const data = await req.json()
    
    // Update user in local DB
    const updatedUser = await db.user.update({
      where: {
        email: session.user?.emailAddresses[0]?.emailAddress
      },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        address1: data.address1,
        address2: data.address2,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country,
        businessName: data.businessName,
        businessType: data.businessType,
        name: `${data.firstName} ${data.lastName}`.trim()
      }
    })

    return new Response(JSON.stringify(updatedUser), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    })
  } catch (error) {
    console.error("Error updating user:", error)
    return new Response(
      JSON.stringify({ error: "Failed to update user" }), 
      { 
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      }
    )
  }
} 