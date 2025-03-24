import { auth, currentUser } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import type { Prisma, User, Brand } from "@prisma/client"

type UserWithBrandAccess = User & {
  brandAccess: Array<{
    id: string
    brandId: string
    role: string
    brand: Brand
  }>
}

type BrandWithAccess = Brand & {
  access: Array<{
    id: string
    userId: string
    role: string
    user: {
      id: string
      email: string
      name: string | null
    }
  }>
  _count: {
    products: number
  }
}

export type BrandAccessResult = {
  isAuthorized: boolean
  brand: BrandWithAccess | null
  user: UserWithBrandAccess | null
  error?: string
  status?: number
}

export async function checkBrandAccess(brandIdOrSlug: string): Promise<BrandAccessResult> {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser?.emailAddresses?.[0]?.emailAddress) {
      return {
        isAuthorized: false,
        brand: null,
        user: null,
        error: "Unauthorized",
        status: 401
      }
    }

    const userEmail = clerkUser.emailAddresses[0].emailAddress

    // Get the user with brand access
    const dbUser = await db.user.findUnique({
      where: { email: userEmail },
      include: {
        brandAccess: {
          include: {
            brand: true
          }
        }
      }
    }) as UserWithBrandAccess | null

    if (!dbUser) {
      return {
        isAuthorized: false,
        brand: null,
        user: null,
        error: "User not found",
        status: 404
      }
    }

    // Get the brand - try both ID and brandId
    const brand = await db.brand.findFirst({
      where: {
        OR: [
          { id: brandIdOrSlug },
          { brandId: brandIdOrSlug }
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
    }) as BrandWithAccess | null

    if (!brand) {
      console.log("[BRAND_ACCESS] Brand not found:", {
        brandIdOrSlug,
        userEmail
      })
      return {
        isAuthorized: false,
        brand: null,
        user: dbUser,
        error: "Brand not found",
        status: 404
      }
    }

    // Check access
    const userAccess = brand.access.find(access => access.user.email === userEmail)
    const isOwner = userAccess?.role === "owner"
    const isManager = userAccess?.role === "manager"
    const isAdmin = dbUser.role === "platformModerator" || dbUser.role === "superAdmin"

    console.log("[BRAND_ACCESS] Check:", {
      brandId: brand.id,
      brandSlug: brand.brandId,
      userEmail,
      isOwner,
      isManager,
      isAdmin,
      userRole: dbUser.role,
      brandAccess: brand.access,
      userAccess
    })

    // Allow access if:
    // 1. User is an owner or manager of the brand - regardless of brand status
    // 2. User is a platform moderator or super admin - regardless of brand status
    // 3. Brand is approved and not hidden (for public access)
    if (isOwner || isManager || isAdmin) {
      console.log("[BRAND_ACCESS] Access granted:", {
        isOwner,
        isManager,
        isAdmin
      })
      return {
        isAuthorized: true,
        brand,
        user: dbUser
      }
    }

    // For non-owners/managers/admins, only allow access if brand is approved and not hidden
    if (brand.isApproved && !brand.isHidden) {
      return {
        isAuthorized: true,
        brand,
        user: dbUser
      }
    }

    return {
      isAuthorized: false,
      brand,
      user: dbUser,
      error: "Access denied",
      status: 403
    }
  } catch (error) {
    console.error("[BRAND_ACCESS]", error)
    return {
      isAuthorized: false,
      brand: null,
      user: null,
      error: "Internal server error",
      status: 500
    }
  }
} 