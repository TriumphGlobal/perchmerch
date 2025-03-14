import { NextResponse } from "next/server"
import { headers } from "next/headers"
import crypto from "crypto"
import { shopifyConfig } from "@/config/shopify"
import { handleOrderWebhook } from "@/lib/shopify"
import { db } from "@/lib/db"
import { prisma } from "@/lib/prisma"
import { verifyShopifyWebhook } from "@/lib/shopify"

// Verify Shopify webhook signature
function verifyShopifyWebhook(body: string, hmac: string) {
  const hash = crypto
    .createHmac("sha256", shopifyConfig.admin.apiSecret)
    .update(body)
    .digest("base64")

  return hash === hmac
}

const SHOPIFY_WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET

export async function POST(req: Request) {
  try {
    // Verify Shopify webhook
    const headerPayload = headers()
    const hmac = headerPayload.get("x-shopify-hmac-sha256")
    
    if (!hmac || !SHOPIFY_WEBHOOK_SECRET) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const rawBody = await req.text()
    const data = JSON.parse(rawBody)

    // Handle order creation
    if (headerPayload.get("x-shopify-topic") === "orders/create") {
      const { customer } = data
      if (!customer?.id) return new NextResponse("No customer ID", { status: 400 })

      // Find any pending platform referrals for this user
      const pendingReferral = await db.platformReferral.findFirst({
        where: {
          referredUserId: customer.id,
          status: "PENDING"
        },
        include: {
          referralLink: true
        }
      })

      if (pendingReferral) {
        const orderTotal = parseFloat(data.total_price)
        const earnings = orderTotal * 0.05 // 5% referral commission

        // Update the referral
        await db.platformReferral.update({
          where: { id: pendingReferral.id },
          data: {
            status: "COMPLETED",
            earnings,
            completedAt: new Date()
          }
        })

        // Update the referral link stats
        await db.referralLink.update({
          where: { id: pendingReferral.referralLink.id },
          data: {
            totalEarnings: {
              increment: earnings
            }
          }
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[SHOPIFY_WEBHOOK_ERROR]", error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
} 