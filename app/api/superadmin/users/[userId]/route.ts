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

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  const headersList = headers();
  const referer = headersList.get("referer") || "unknown";
  console.log(`Admin User Details API: Request from ${referer}`);
  
  // Get the current user ID
  const currentUserId = await getCurrentUserId();
  if (!currentUserId) {
    console.log(`Admin User Details API: Unauthorized - no authentication`);
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Check if current user is an admin
  const isAdmin = await isUserAdmin(currentUserId);
  if (!isAdmin) {
    console.log(`Admin User Details API: Forbidden - user ${currentUserId} is not an admin`);
    return NextResponse.json(
      { error: "Forbidden - Only admins can view user details" },
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

  try {
    // Get the user from the database
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isSuperAdmin: true,
        isPlatformAdmin: true,
        createdAt: true,
        lastsign-inAt: true,
        // Add relations if needed
        _count: {
          select: {
            brands: true,  // Count of related brands
            orders: true,  // Count of related orders
          }
        }
      }
    });

    if (!user) {
      console.log(`Admin User Details API: User ${userId} not found`);
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Calculate user's total sales if needed
    let totalSales = 0;
    try {
      const result = await db.order.aggregate({
        where: {
          userId: userId,
          status: "completed" // Only count completed orders
        },
        _sum: {
          totalAmount: true
        }
      });
      totalSales = result._sum.totalAmount || 0;
    } catch (error) {
      console.error("Error calculating total sales:", error);
      // Continue with totalSales = 0
    }

    // Format the response
    const formattedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isSuperAdmin: user.isSuperAdmin,
      isPlatformAdmin: user.isPlatformAdmin,
      createdAt: user.createdAt.toISOString(),
      lastsign-inAt: user.lastsign-inAt ? user.lastsign-inAt.toISOString() : null,
      brandCount: user._count.brands,
      orderCount: user._count.orders,
      totalSales
    };

    console.log(`Admin User Details API: Successfully retrieved user ${userId}`);
    
    return NextResponse.json(
      { user: formattedUser },
      {
        headers: {
          // Cache for 1 minute, private to this user
          "Cache-Control": "private, max-age=60"
        }
      }
    );
  } catch (error) {
    console.error("Admin User Details API: Error fetching user:", error);
    
    return NextResponse.json(
      { error: "Failed to fetch user details" },
      { status: 500 }
    );
  }
} 