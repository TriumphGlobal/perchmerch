import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { cache } from "react"

// Cache the user data for 5 seconds to prevent multiple slow loads
const getCachedUser = cache(async (userId: string) => {
  return await db.user.findUnique({
    where: { id: userId },
    include: {
      brandAccess: {
        include: {
          brand: true
        }
      }
    },
  })
})

export type BrandAccessResult = {
  isAuthorized: boolean
  brand: any | null
  user: any | null
  error?: string
  status?: number
}

export async function checkBrandAccess(brandId: string, userEmail?: string): Promise<BrandAccessResult> {
  try {
    let dbUser = null;

    // Try to get user from email first if provided
    if (userEmail) {
      dbUser = await db.user.findUnique({
        where: { email: userEmail },
        include: {
          brandAccess: {
            include: {
              brand: true
            }
          }
        }
      });
    } 
    
    // If no email provided or user not found by email, try Clerk auth
    if (!dbUser) {
      const { userId } = await auth();
      if (!userId) {
        return {
          isAuthorized: false,
          brand: null,
          user: null,
          error: "Unauthorized",
          status: 401
        };
      }
      dbUser = await getCachedUser(userId);
    }

    if (!dbUser) {
      return {
        isAuthorized: false,
        brand: null,
        user: null,
        error: "User not found",
        status: 404
      };
    }

    // Get the brand with access info
    const brand = await db.brand.findFirst({
      where: {
        OR: [
          { id: brandId },
          { brandId: brandId }
        ],
        isDeleted: false
      },
      include: {
        access: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true
              }
            }
          }
        },
        _count: {
          select: {
            products: true
          }
        }
      }
    });

    if (!brand) {
      return {
        isAuthorized: false,
        brand: null,
        user: dbUser,
        error: "Brand not found",
        status: 404
      };
    }

    // Check access
    const userAccess = brand.access.find(access => access.user.email === (userEmail || dbUser.email));
    const isOwner = userAccess?.role === "owner";
    const isManager = userAccess?.role === "manager";
    const isAdmin = dbUser.role === "platformModerator" || dbUser.role === "superAdmin";

    console.log("[BRAND_ACCESS] Check:", {
      brandId: brand.id,
      userEmail: userEmail || dbUser.email,
      isOwner,
      isManager,
      isAdmin,
      userRole: dbUser.role
    });

    if (isOwner || isManager || isAdmin) {
      return {
        isAuthorized: true,
        brand,
        user: dbUser
      };
    }

    // For non-owners/managers/admins, only allow access if brand is approved and not hidden
    if (brand.isApproved && !brand.isHidden) {
      return {
        isAuthorized: true,
        brand,
        user: dbUser
      };
    }

    return {
      isAuthorized: false,
      brand,
      user: dbUser,
      error: "Access denied",
      status: 403
    };
  } catch (error) {
    console.error("[BRAND_ACCESS]", error);
    return {
      isAuthorized: false,
      brand: null,
      user: null,
      error: "Internal server error",
      status: 500
    };
  }
} 