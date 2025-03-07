import { env } from "@/env.mjs"

export const shopifyConfig = {
  storefront: {
    apiVersion: "2024-01",
    apiKey: env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_API_KEY,
    apiUrl: `https://${env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN}/api/2024-01/graphql`,
  },
  admin: {
    apiVersion: "2024-01",
    apiKey: env.SHOPIFY_ADMIN_API_KEY,
    apiSecret: env.SHOPIFY_ADMIN_API_SECRET,
    scopes: [
      "read_products",
      "write_products",
      "read_orders",
      "write_orders",
      "read_customers",
      "write_customers",
    ],
    hostName: env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN,
  },
}

export const urlConfig = {
  // Base URL for the platform
  baseUrl: "https://perchmerch.com",
  
  // Generate brand URL
  getBrandUrl: (brandSlug: string) => `${urlConfig.baseUrl}/${brandSlug}`,
  
  // Generate affiliate URL
  getAffiliateUrl: (brandSlug: string, affiliateId: string) => 
    `${urlConfig.baseUrl}/${brandSlug}?ref=${affiliateId}`,
  
  // Parse affiliate ID from URL
  parseAffiliateId: (url: URL) => url.searchParams.get("ref"),
}

export const commissionConfig = {
  // Platform takes 50% of profit
  platformCommissionRate: 0.5,
  
  // Calculate commission for a given sale amount
  calculateCommission: (saleAmount: number) => saleAmount * commissionConfig.platformCommissionRate,
} 