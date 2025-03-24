import { auth, currentUser } from "@clerk/nextjs/server"
import { db } from "./db"
import type { UserRole, BusinessType, DBUser } from "@/types/localDbU"
import type { ClerkRole } from "@/types/clerkU"
import type { Prisma, User, BrandAccess, Brand, Order, Affiliate } from "@prisma/client"

type DbUserResult = User & {
  brandAccess: (BrandAccess & {
    brand: Brand;
  })[];
  orders: Order[];
  affiliateFor: Affiliate[];
  activities: any[];
  payouts: any[];
  analytics: any[];
  referredByMe: any[];
  referredMe: any[];
  referralLinks: any[];
  paymentMethods: any[];
  reports: any[];
  reportedItems: any[];
  modifiedGenres: any[];
}

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
    const clerkRole = (
      (clerkUser.publicMetadata?.role as ClerkRole) || 
      (clerkUser.privateMetadata?.role as ClerkRole) || 
      'user'
    ) as UserRole

    // Try to find user in local DB with brand access
    const dbUser = await db.user.findUnique({
      where: { email },
      include: {
        brandAccess: {
          include: {
            brand: true
          }
        },
        orders: true,
        affiliateFor: true,
        activities: true,
        payouts: true,
        analytics: true,
        referredByMe: true,
        referredMe: true,
        referralLinks: true,
        paymentMethods: true,
        reports: true,
        reportedItems: true,
        modifiedGenres: true
      }
    }) as DbUserResult | null

    // If no user found, return null - don't auto-create
    if (!dbUser) {
      return null
    }

    // Convert Prisma user to DBUser type, but use Clerk role
    return {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name || clerkUser.firstName || null,
      role: clerkRole, // Use the role from Clerk instead of database
      firstName: dbUser.firstName || null,
      lastName: dbUser.lastName || null,
      phoneNumber: dbUser.phoneNumber || null,
      address1: dbUser.address1 || null,
      address2: dbUser.address2 || null,
      city: dbUser.city || null,
      state: dbUser.state || null,
      postalCode: dbUser.postalCode || null,
      country: dbUser.country || null,
      businessName: dbUser.businessName || null,
      businessType: (dbUser.businessType as BusinessType) || null,
      platformReferredByEmail: dbUser.platformReferredByEmail,
      platformReferredEmails: dbUser.platformReferredEmails,
      platformReferralEarnings: dbUser.platformReferralEarnings,
      orderIds: dbUser.orderIds,
      brandAccess: dbUser.brandAccess.map(access => ({
        id: access.id,
        brandId: access.brand.brandId,
        role: access.role as 'owner' | 'manager',
        brand: {
          id: access.brand.id,
          name: access.brand.name,
          brandId: access.brand.brandId
        }
      })),
      orders: dbUser.orders.map(order => ({
        id: order.id,
        totalAmount: order.totalAmount
      })),
      affiliateFor: dbUser.affiliateFor.map(af => ({
        id: af.id,
        brandId: af.brandId,
        commissionRate: af.affiliateRate
      })),
      createdAt: dbUser.createdAt,
      updatedAt: dbUser.updatedAt,
      bannedAt: dbUser.bannedAt,
      bannedBy: dbUser.bannedBy,
      banReason: dbUser.banReason,
      banExpiresAt: dbUser.banExpiresAt,
      deletedAt: dbUser.deletedAt,
      lastLoginAt: dbUser.lastLoginAt,
      paypalEmail: dbUser.paypalEmail || null,
      stripeConnectedAccountId: dbUser.stripeConnectedAccountId || null,
      dateOfBirth: dbUser.dateOfBirth || null,
      activities: dbUser.activities,
      payouts: dbUser.payouts,
      analytics: dbUser.analytics,
      referredByMe: dbUser.referredByMe,
      referredMe: dbUser.referredMe,
      referralLinks: dbUser.referralLinks,
      paymentMethods: dbUser.paymentMethods,
      reports: dbUser.reports,
      reportedItems: dbUser.reportedItems,
      modifiedGenres: dbUser.modifiedGenres
    }
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
        ownedBrands: {
          select: {
            brandId: true
          }
        }
      }
    })

    return user?.ownedBrands?.some(brand => brand.brandId === brandId) || false
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
        orderIds: [],
        platformReferralEarnings: 0,
        lastLoginAt: new Date()
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        address1: true,
        address2: true,
        city: true,
        state: true,
        postalCode: true,
        country: true,
        businessName: true,
        businessType: true,
        platformReferredByEmail: true,
        platformReferredEmails: true,
        platformReferralEarnings: true,
        orderIds: true,
        createdAt: true,
        updatedAt: true,
        bannedAt: true,
        bannedBy: true,
        banReason: true,
        banExpiresAt: true,
        deletedAt: true,
        lastLoginAt: true,
        ownedBrands: {
          select: {
            id: true,
            name: true,
            brandId: true
          }
        },
        managedBrands: {
          select: {
            id: true,
            name: true,
            brandId: true
          }
        },
        orders: {
          select: {
            id: true,
            totalAmount: true
          }
        },
        affiliateFor: {
          select: {
            id: true,
            brandId: true,
            affiliateRate: true
          }
        },
        activities: true,
        payouts: true,
        analytics: true,
        referredByMe: true,
        referredMe: true,
        referralLinks: true,
        paymentMethods: true,
        reports: true,
        reportedItems: true,
        modifiedGenres: true
      }
    })

    // Convert to DBUser type
    return {
      ...dbUser,
      role: role as UserRole,
      businessType: (dbUser.businessType as BusinessType) || null,
      brandAccess: [
        ...dbUser.ownedBrands.map((brand: { id: string; name: string; brandId: string }) => ({
          id: brand.id,
          brandId: brand.brandId,
          role: 'owner' as const,
          brand: {
            id: brand.id,
            name: brand.name,
            brandId: brand.brandId
          }
        })),
        ...dbUser.managedBrands.map((brand: { id: string; name: string; brandId: string }) => ({
          id: brand.id,
          brandId: brand.brandId,
          role: 'manager' as const,
          brand: {
            id: brand.id,
            name: brand.name,
            brandId: brand.brandId
          }
        }))
      ],
      affiliateFor: dbUser.affiliateFor.map((af) => ({
        id: af.id,
        brandId: af.brandId,
        commissionRate: af.affiliateRate
      }))
    } as DBUser
  } catch (error) {
    console.error("Error syncing user with Clerk:", error)
    return null
  }
}

export async function authenticatedMiddleware(request: Request) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return {
        success: false,
        error: 'No authorization token provided',
        user: null
      }
    }

    // Get the session using Clerk's auth
    const session = await auth()
    if (!session?.userId) {
      return {
        success: false,
        error: 'Invalid or expired session',
        user: null
      }
    }

    // Get the user data
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: 'User not found in database',
        user: null
      }
    }

    return {
      success: true,
      error: null,
      user
    }
  } catch (error) {
    console.error('Auth middleware error:', error)
    return {
      success: false,
      error: 'Authentication failed',
      user: null
    }
  }
}

const isOwnerOfBrand = (brandId: string): boolean => {
  if (!currentUser) return false
  return currentUser.brandAccess.some(access => 
    access.brand.brandId === brandId && access.role === 'owner'
  )
}

const canManageBrand = (brandId: string): boolean => {
  if (!currentUser) return false

  if (brandId === "demo") return currentUser.role === "superAdmin"

  return currentUser.brandAccess.some(access => 
    access.brand.brandId === brandId && 
    (access.role === 'owner' || access.role === 'manager')
  )
} 