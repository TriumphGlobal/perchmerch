import { auth, currentUser } from "@clerk/nextjs/server";

export async function GET() {
  try {
    // Get the current authenticated user
    const user = await currentUser();
    
    // If no user is found, return an error
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Extract the required user details
    const userData = {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress,
      name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      imageUrl: user.imageUrl,
    };
    
    // Return the user data
    return new Response(
      JSON.stringify(userData),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching user data:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch user data" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
} 