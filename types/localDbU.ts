import type { ClerkRole } from "./clerkU"

export type UserRole = 'user' | 'platformAdmin' | 'superAdmin'

export interface DBUser {
  email: string;         // Primary identifier, same as Clerk email
  name: string | null;
  role: UserRole;
  
  // Platform referral system
  platformReferredByEmail: string | null;  // Email of the user who referred this user
  platformReferredEmails: string[];  // Emails of users referred by this user
  platformReferralEarnings: number;
  
  // User's brands
  brandIds: string[];    // Array of brandIds owned by this user
  brands: Array<{
    id: string;
    name: string;
    brandId: string;
  }>;      // Relationship to Brand model
  
  // User's orders
  orderIds: string[];    // Array of order IDs associated with this user
  orders: Array<{
    id: string;
    shopifyId: string;
    totalAmount: number;
  }>;      // Relationship to Order model
  
  // User's affiliate relationships
  affiliateLinks: string[];
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
  // New fields for Printify and payouts
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  address1: string | null;
  address2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  // Payout information
  paypalEmail: string | null;
  stripeConnectedAccountId: string | null;
  taxId: string | null;
  businessName: string | null;
  businessType: 'individual' | 'company' | null;
  dateOfBirth: Date | null;
}

interface Brand {
  id: string;
  name: string;
  brandId: string;
}

interface Order {
  id: string;
  shopifyId: string;
  totalAmount: number;
}

interface Affiliate {
  id: string;
  brandId: string;
  commissionRate: number;
} 