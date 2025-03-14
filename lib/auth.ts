import { auth, currentUser } from "@clerk/nextjs/server"
import { db } from "./db"
import type { UserRole } from "@/types/localDbU"
import type { DBUser } from "@/types/localDbU"
import type { ClerkUser, ClerkRole } from "@/types/clerkU"

export async function getCurrentUser(): Promise<DBUser | null> {
  try {
    // Get both session and user data from Clerk
    const [session, clerkUser] = await Promise.all([
      auth(),
      currentUser()
    ])

    if (!clerkUser) {
      return null
    }

    // Get email from Clerk user object (more reliable)
    const email = clerkUser.emailAddresses[0]?.emailAddress
    if (!email) {
      return null
    }

    // Get role from metadata (checking both public and private)
    const role = (
      (clerkUser.publicMetadata?.role as ClerkRole) || 
      (clerkUser.privateMetadata?.role as ClerkRole) || 
      'user'
    ) as UserRole

    // Try to find user in local DB
    const dbUser = await db.user.findUnique({
      where: { email },
      include: {
        brands: {
          select: {
            id: true,
            name: true,
            brandId: true
          }
        },
        orders: {
          select: {
            id: true,
            shopifyId: true,
            totalAmount: true
          }
        },
        affiliateFor: {
          select: {
            id: true,
            brandId: true,
            commissionRate: true
          }
        }
      }
    })

    // If no user found, return null - don't auto-create
    if (!dbUser) {
      return null
    }

    // Convert Prisma user to DBUser type
    const userWithRelations: DBUser = {
      email: dbUser.email,
      name: dbUser.name || clerkUser.firstName || null,
      role: dbUser.role as UserRole,
      platformReferredByEmail: dbUser.platformReferredByEmail,
      platformReferredEmails: dbUser.platformReferredEmails,
      platformReferralEarnings: dbUser.platformReferralEarnings,
      brandIds: dbUser.brandIds,
      orderIds: dbUser.orderIds,
      affiliateLinks: dbUser.affiliateLinks,
      createdAt: dbUser.createdAt,
      updatedAt: dbUser.updatedAt,
      bannedAt: dbUser.bannedAt,
      bannedBy: dbUser.bannedBy,
      banReason: dbUser.banReason,
      banExpiresAt: dbUser.banExpiresAt,
      brands: dbUser.brands,
      orders: dbUser.orders,
      affiliateFor: dbUser.affiliateFor
    }

    return userWithRelations
  } catch (error) {
    console.error("Error in getCurrentUser:", error)
    return null
  }
}

export async function checkBrandOwnership(email: string, brandId: string): Promise<boolean> {
  try {
    const user = await db.user.findUnique({
      where: { email },
      select: {
        brandIds: true
      }
    })

    return user?.brandIds?.includes(brandId) || false
  } catch (error) {
    console.error("Error checking brand ownership:", error)
    return false
  }
}

export async function syncUserWithClerk(email: string, role: UserRole): Promise<DBUser | null> {
  try {
    const dbUser = await db.user.upsert({
      where: { email },
      update: { role },
      create: {
        email,
        role,
        platformReferredEmails: [],
        brandIds: [],
        orderIds: [],
        affiliateLinks: [],
        platformReferralEarnings: 0
      },
      select: {
        email: true,
        name: true,
        role: true,
        platformReferredByEmail: true,
        platformReferredEmails: true,
        platformReferralEarnings: true,
        brandIds: true,
        orderIds: true,
        affiliateLinks: true,
        createdAt: true,
        updatedAt: true,
        bannedAt: true,
        bannedBy: true,
        banReason: true,
        banExpiresAt: true
      }
    })

    return dbUser as DBUser
  } catch (error) {
    console.error("Error syncing user with Clerk:", error)
    return null
  }
} 