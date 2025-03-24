import { auth, currentUser } from "@clerk/nextjs/server"
import { db } from "../../../lib/db"

export async function PUT(req: Request) {
  try {
    // Get both session and current user to ensure we have the email
    const [session, user] = await Promise.all([
      auth(),
      currentUser()
    ])

    if (!session || !user) {
      return new Response("Unauthorized", { status: 401 })
    }

    const email = user.emailAddresses[0]?.emailAddress
    if (!email) {
      return new Response("No email found", { status: 400 })
    }

    const data = await req.json()
    console.log("Updating user:", email, "with data:", data)
    
    // Update user in local DB
    const updatedUser = await db.user.update({
      where: {
        email: email
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

    console.log("User updated successfully:", updatedUser)

    return new Response(JSON.stringify(updatedUser), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    })
  } catch (error) {
    console.error("Error updating user:", error)
    return new Response(
      JSON.stringify({ 
        error: "Failed to update user",
        details: error instanceof Error ? error.message : "Unknown error"
      }), 
      { 
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      }
    )
  }
} 