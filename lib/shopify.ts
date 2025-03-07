import { shopifyConfig } from "@/config/shopify"
import { db } from "@/lib/db"

// Types for Shopify responses
interface ShopifyProduct {
  id: string
  title: string
  handle: string
  description: string
  images: { edges: Array<{ node: { url: string } }> }
  variants: { edges: Array<{ node: { price: string } }> }
  vendor: string // Used to identify Printify products
  tags: string[]
}

interface ShopifyOrder {
  id: string
  totalPrice: string
  referralSource?: string
  customer: {
    firstName: string
    lastName: string
    email: string
  }
}

// Shopify Storefront API client
const storefrontFetch = async (query: string, variables = {}) => {
  const response = await fetch(shopifyConfig.storefront.apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": shopifyConfig.storefront.apiKey,
    },
    body: JSON.stringify({ query, variables }),
  })

  const json = await response.json()
  if (json.errors) {
    throw new Error(json.errors[0].message)
  }

  return json.data
}

// Shopify Admin API client
const adminFetch = async (endpoint: string, method = "GET", data?: any) => {
  const url = `https://${shopifyConfig.admin.hostName}/admin/api/${shopifyConfig.admin.apiVersion}/${endpoint}`
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": shopifyConfig.admin.apiKey,
    },
    body: data ? JSON.stringify(data) : undefined,
  })

  if (!response.ok) {
    throw new Error(`Shopify admin API error: ${response.statusText}`)
  }

  return response.json()
}

// Product management
export const getProducts = async (brandId: string) => {
  const query = `
    query Products {
      products(first: 50, query: "vendor:Printify") {
        edges {
          node {
            id
            title
            handle
            description
            vendor
            tags
            images(first: 1) {
              edges {
                node {
                  url
                }
              }
            }
            variants(first: 1) {
              edges {
                node {
                  price
                }
              }
            }
          }
        }
      }
    }
  `

  const data = await storefrontFetch(query)
  return data.products.edges
    .map((edge: { node: ShopifyProduct }) => edge.node)
    .filter(product => product.vendor === "Printify") // Double-check it's a Printify product
}

// Order management
export const createOrder = async (orderData: any) => {
  return adminFetch("orders.json", "POST", {
    order: {
      ...orderData,
      source_name: "PerchMerch",
      tags: ["PerchMerch"],
    },
  })
}

// Webhook handling
export const handleOrderWebhook = async (order: ShopifyOrder) => {
  const orderTotal = parseFloat(order.totalPrice)
  const platformShare = orderTotal * 0.5    // Platform gets 50%
  const brandShare = orderTotal * 0.5       // Brand gets 50%
  
  try {
    // Get brand ID from order
    const brandId = await getBrandIdFromOrder(order)
    
    // Always create the base order record
    const orderRecord = await db.order.create({
      data: {
        shopifyId: order.id,
        brandId: brandId,
        totalAmount: orderTotal,
        brandEarnings: brandShare,
      },
    })

    // Update brand's total earnings
    await db.brand.update({
      where: { id: brandId },
      data: {
        totalSales: { increment: orderTotal },
        totalEarnings: { increment: brandShare },
      },
    })

    // Check for affiliate - optional part
    const affiliateId = order.referralSource?.split("ref=")[1]
    if (affiliateId) {
      const affiliate = await db.affiliate.findUnique({
        where: { id: affiliateId },
        include: { brand: true },
      })

      if (affiliate) {
        // Calculate affiliate's due amount from brand's profit share
        const affiliateDue = brandShare * affiliate.commissionRate

        // Update order with affiliate info
        await db.order.update({
          where: { id: orderRecord.id },
          data: {
            affiliateId: affiliate.id,
            affiliateDue: affiliateDue,
          },
        })

        // Update affiliate stats
        await db.affiliate.update({
          where: { id: affiliate.id },
          data: {
            totalSales: { increment: orderTotal },
            totalDue: { increment: affiliateDue },
          },
        })
      }
    }

    return { processed: true }
  } catch (error) {
    console.error("Error processing order webhook:", error)
    throw error
  }
}

// Helper to get brand ID from order
const getBrandIdFromOrder = async (order: ShopifyOrder): Promise<string> => {
  // Get the first product from the order and check its collection/brand
  const response = await adminFetch(`orders/${order.id}.json`, "GET")
  const firstProduct = response.order.line_items[0]
  
  // Get product's brand collection
  const productResponse = await adminFetch(`products/${firstProduct.product_id}.json`, "GET")
  const brandTag = productResponse.product.tags
    .split(", ")
    .find((tag: string) => tag.startsWith("brand_"))
  
  if (!brandTag) {
    throw new Error("Cannot determine brand from order")
  }

  const brandSlug = brandTag.replace("brand_", "")
  
  // Get brand by slug
  const brand = await db.brand.findUnique({
    where: { slug: brandSlug },
  })

  if (!brand) {
    throw new Error("Brand not found")
  }

  return brand.id
}

// Update affiliate commission rate - now based on brand's profit share
export const updateAffiliateCommissionRate = async (
  affiliateId: string,
  percentOfBrandProfit: number, // Brand owner enters 0-100%
  brandId: string
) => {
  // Validate the rate is between 0 and 100 percent of brand's profit
  if (percentOfBrandProfit < 0 || percentOfBrandProfit > 100) {
    throw new Error("Commission rate must be between 0 and 100 percent of your profit share")
  }

  // Convert percentage to decimal of brand's profit
  const commissionRate = percentOfBrandProfit / 100

  // Update the affiliate's commission rate
  return db.affiliate.update({
    where: {
      id: affiliateId,
      brandId: brandId,
    },
    data: {
      commissionRate: commissionRate, // Stored as decimal (0.1 = 10% of brand's profit)
    },
  })
}

// Brand store management
export const createBrandStore = async (brandData: any) => {
  // Create a new "collection" in Shopify to represent the brand's store
  const collection = await adminFetch("custom_collections.json", "POST", {
    custom_collection: {
      title: brandData.name,
      handle: brandData.slug,
      body_html: brandData.description,
      published: true,
      // Add tag to identify this as a PerchMerch brand collection
      disjunctive: false,
      rules: [
        {
          column: "vendor",
          relation: "equals",
          condition: "Printify"
        },
        {
          column: "tag",
          relation: "equals",
          condition: `brand_${brandData.slug}`
        }
      ]
    },
  })

  return collection
}

// Product assignment
export const assignProductToBrand = async (productId: string, brandId: string, brandSlug: string) => {
  // First, add the brand tag to the product
  await adminFetch(`products/${productId}.json`, "PUT", {
    product: {
      id: productId,
      tags: `brand_${brandSlug}` // This will be used by the collection rules
    }
  })

  // The product will automatically be added to the collection based on the rules
  return { success: true }
}

// Validate product is from Printify
export const validatePrintifyProduct = async (productId: string) => {
  const response = await adminFetch(`products/${productId}.json`, "GET")
  const product = response.product

  return {
    isValid: product.vendor === "Printify",
    product
  }
} 