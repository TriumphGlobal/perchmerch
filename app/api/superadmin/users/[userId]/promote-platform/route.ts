import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

// Helper function to check if user is a super admin
async function isUserSuperAdmin(userId: string) {
  try {
    // Get user from database where we store role information
    const dbUser = await db.user.findUnique({
      where: { id: userId },
      select: { 
        isSuperAdmin: true 
      },
    });

    return dbUser?.isSuperAdmin === true;
  } catch (error) {
    console.error("Error checking super admin status:", error);
    return false;
  }
}

// Helper function to check if user is a platform admin
async function isUserPlatformAdmin(userId: string) {
  try {
    // Get user from database where we store role information
    const dbUser = await db.user.findUnique({
      where: { id: userId },
      select: { 
        isSuperAdmin: true,
        isPlatformAdmin: true 
      },
    });

    return dbUser && (dbUser.isSuperAdmin || dbUser.isPlatformAdmin);
  } catch (error) {
    console.error("Error checking platform admin status:", error);
    return false;
  }
}

// Extract user ID from auth cookie or JWT
async function getCurrentUserId() {
  // This is a placeholder - in a real app you would extract this
  // from your authentication system (Clerk, Auth.js, etc.)
  // For demo purposes we'll use a cookie
  const cookieStore = cookies();
  const authCookie = cookieStore.get("user_session");
  
  if (!authCookie?.value) return null;
  
  try {
    const data = JSON.parse(authCookie.value);
    return data.userId;
  } catch (e) {
    return null;
  }
}

export async function POST(
  request: Request,
  { params }: { params: { userId: string } }
) {
  const headersList = headers();
  const referer = headersList.get("referer") || "unknown";
  console.log(`Admin Promote Platform API: Request from ${referer}`);
  
  // Get the current user ID
  const currentUserId = await getCurrentUserId();
  if (!currentUserId) {
    console.log(`Admin Promote Platform API: Unauthorized - no authentication`);
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Check if current user is at least a platform admin
  const isAdmin = await isUserPlatformAdmin(currentUserId);
  if (!isAdmin) {
    console.log(`Admin Promote Platform API: Forbidden - user ${currentUserId} is not an admin`);
    return NextResponse.json(
      { error: "Forbidden - Only admins can promote users" },
      { status: 403 }
    );
  }

  const { userId } = params;
  if (!userId) {
    return NextResponse.json(
      { error: "User ID is required" },
      { status: 400 }
    );
  }

  // Verify target user exists
  const targetUser = await db.user.findUnique({
    where: { id: userId },
  });

  if (!targetUser) {
    return NextResponse.json(
      { error: "User not found" },
      { status: 404 }
    );
  }

  try {
    // Promote user to platform admin
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        isPlatformAdmin: true,
        role: "platform",
      },
    });

    console.log(`Admin Promote Platform API: User ${userId} promoted to platform admin by ${currentUserId}`);

    // Log the action - we'll just use console.log for now
    // In a production app, you would want to create a proper audit trail in the database
    console.log(`ADMIN AUDIT: User ${currentUserId} promoted user ${userId} to Platform Admin at ${new Date().toISOString()}`);

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        isPlatformAdmin: updatedUser.isPlatformAdmin,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error("Admin Promote Platform API: Error promoting user:", error);
    
    return NextResponse.json(
      { error: "Failed to promote user" },
      { status: 500 }
    );
  }
} 