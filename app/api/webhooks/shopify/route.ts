import { NextResponse } from "next/server"
import { headers } from "next/headers"
import crypto from "crypto"
import { shopifyConfig } from "@/config/shopify"
import { handleOrderWebhook } from "@/lib/shopify"
import { db } from "@/lib/db"

// Verify Shopify webhook signature
function verifyShopifyWebhook(body: string, hmac: string) {
  const hash = crypto
    .createHmac("sha256", shopifyConfig.admin.apiSecret)
    .update(body)
    .digest("base64")

  return hash === hmac
}

export async function POST(req: Request) {
  const headersList = headers()
  const hmac = headersList.get("x-shopify-hmac-sha256")
  const topic = headersList.get("x-shopify-topic")
  
  if (!hmac || !topic) {
    return new NextResponse("Missing signature or topic", { status: 401 })
  }

  const body = await req.text()
  const isValid = verifyShopifyWebhook(body, hmac)

  if (!isValid) {
    return new NextResponse("Invalid signature", { status: 401 })
  }

  const data = JSON.parse(body)

  try {
    switch (topic) {
      case "orders/create":
        // Process new order
        const result = await handleOrderWebhook(data)
        
        // If there's an affiliate referral, create commission record
        if (data.referral_code) {
          const affiliate = await db.affiliate.findFirst({
            where: { id: data.referral_code },
          })

          if (affiliate) {
            const commission = parseFloat(data.total_price) * 0.5 // 50% commission
            
            await db.commission.create({
              data: {
                affiliateId: affiliate.id,
                orderId: data.id,
                amount: commission,
              },
            })

            // Update affiliate's total earnings
            await db.affiliate.update({
              where: { id: affiliate.id },
              data: {
                totalEarnings: {
                  increment: commission,
                },
              },
            })
          }
        }
        break

      // Add more webhook handlers as needed
      default:
        console.log(`Unhandled webhook topic: ${topic}`)
    }

    return new NextResponse("Webhook processed", { status: 200 })
  } catch (error) {
    console.error("Webhook processing error:", error)
    return new NextResponse("Webhook processing failed", { status: 500 })
  }
} 