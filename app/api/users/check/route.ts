import { db } from "../../../../lib/db"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const email = searchParams.get("email")

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      )
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { email }
    })

    return new Response(
      JSON.stringify({ exists: !!user }),
      { 
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("Error checking user existence:", error)
    return new Response(
      JSON.stringify({ 
        error: "Failed to check user",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    )
  }
} 