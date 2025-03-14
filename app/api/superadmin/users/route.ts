import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

// Helper function to check if user is an admin
async function isUserAdmin(userId: string) {
  try {
    // Get user from database where we store role information
    const dbUser = await db.user.findUnique({
      where: { id: userId },
      select: { 
        role: true,
        isSuperAdmin: true,
        isPlatformAdmin: true 
      },
    });

    return dbUser && (dbUser.isSuperAdmin || dbUser.isPlatformAdmin);
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

// Extract user ID from auth cookie or session
async function getUserIdFromRequest() {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get("__session")?.value;
  
  if (!sessionToken) {
    return null;
  }
  
  try {
    // Find the user session in the database
    const session = await db.session.findUnique({
      where: { token: sessionToken },
      select: { userId: true }
    });
    
    return session?.userId || null;
  } catch (error) {
    console.error("Error getting user from session:", error);
    return null;
  }
}

export async function GET() {
  const headersList = headers();
  const referer = headersList.get("referer") || "unknown";
  console.log(`Admin Users API: Request from ${referer}`);

  // Authenticate request
  const userId = await getUserIdFromRequest();
  if (!userId) {
    console.log("Admin Users API: Unauthorized access attempt - No user ID");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is admin
  const isAdmin = await isUserAdmin(userId);
  if (!isAdmin) {
    console.log(`Admin Users API: Unauthorized access attempt - User ${userId} is not an admin`);
    return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403 });
  }

  try {
    console.log("Admin Users API: Fetching users from database");
    
    // Get all users from our database
    const dbUsers = await db.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isSuperAdmin: true,
        isPlatformAdmin: true,
        createdAt: true,
      },
    });

    console.log(`Admin Users API: Found ${dbUsers.length} users in database`);

    // Format users for API response
    const formattedUsers = dbUsers.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isSuperAdmin: user.isSuperAdmin,
      isPlatformAdmin: user.isPlatformAdmin,
      createdAt: user.createdAt.toISOString(),
    }));

    console.log(`Admin Users API: Returning ${formattedUsers.length} users`);
    
    return NextResponse.json(
      { users: formattedUsers },
      {
        headers: {
          "Cache-Control": "private, max-age=60" // Cache for 1 minute, private to this user
        }
      }
    );
  } catch (error) {
    console.error("Admin Users API: Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
} 