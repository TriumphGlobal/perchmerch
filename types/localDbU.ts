import type { ClerkRole } from "./clerkU"

export type UserRole = 'user' |  'superAdmin' | 'platformAdmin'
export type BusinessType = 'individual' | 'company'

export interface DBUser {
  id: string;           // Primary key from Prisma
  email: string;        // Primary identifier, same as Clerk email
  name: string | null;
  role: UserRole;
  
  // Platform referral system
  platformReferredByEmail: string | null;  // Email of the user who referred this user
  platformReferredEmails: string[];  // Emails of users referred by this user
  platformReferralEarnings: number;
  
  // User's brand access
  brandAccess: Array<{
    id: string;
    brandId: string;
    role: 'owner' | 'manager';
    brand: {
      id: string;
      name: string;
      brandId: string;
    };
  }>;
  
  // User's orders
  orderIds: string[];   // Array of order IDs
  orders: Array<{
    id: string;
    totalAmount: number;
  }>;      // Relationship to Order model
  
  // User's affiliate relationships
  affiliateFor: Array<{
    id: string;
    brandId: string;
    commissionRate: number;
  }>; // Brands this user is an affiliate for
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  bannedAt: Date | null;
  bannedBy: string | null;
  banReason: string | null;
  banExpiresAt: Date | null;
  deletedAt: Date | null;
  lastLoginAt: Date;

  // Personal Information
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  address1: string | null;
  address2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  businessName: string | null;
  businessType: BusinessType | null;
  
  // Payment Information
  paypalEmail: string | null;
  stripeConnectedAccountId: string | null;
  dateOfBirth: Date | null;

  // Additional relationships from Prisma schema
  activities: any[];      // UserActivity[]
  payouts: any[];        // Payout[]
  analytics: any[];      // Analytics[]
  referredByMe: any[];   // PlatformReferral[]
  referredMe: any[];     // PlatformReferral[]
  referralLinks: any[];  // PlatformReferralLink[]
  paymentMethods: any[]; // PaymentMethod[]
  reports: any[];        // Report[]
  reportedItems: any[];  // Report[]
  modifiedGenres: any[]; // Genre[]
}

interface Brand {
  id: string;
  name: string;
  brandId: string;
}

interface Order {
  id: string;
  totalAmount: number;
}

interface Affiliate {
  id: string;
  brandId: string;
  commissionRate: number;
} 