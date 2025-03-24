import { auth } from "@clerk/nextjs/server"
import { currentUser } from "@clerk/nextjs/server"
import { NextRequest } from "next/server"
import { db } from "../../../../lib/db"
import { PaymentMethod } from "@prisma/client"

export async function POST(
  req: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const session = await auth()
    const user = await currentUser()

    if (!session?.userId || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      })
    }

    const email = user.emailAddresses[0]?.emailAddress
    if (!email) {
      return new Response(JSON.stringify({ error: "No email found" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      })
    }

    // Get the local user
    const localUser = await db.user.findUnique({
      where: { email }
    })

    if (!localUser) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      })
    }

    // Check if payment method already exists
    const existingPaymentMethod = await db.paymentMethod.findUnique({
      where: {
        userId_provider: {
          userId: localUser.id,
          provider: params.provider
        }
      }
    })

    if (existingPaymentMethod) {
      return new Response(
        JSON.stringify({ error: "Payment method already connected" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      )
    }

    // Handle different providers
    switch (params.provider) {
      case "stripe":
        return handleStripeConnect(localUser)
      case "paypal":
        return handlePayPalConnect(localUser)
      case "google-pay":
        return handleGooglePayConnect(localUser)
      case "apple-pay":
        return handleApplePayConnect(localUser)
      case "shop-pay":
        return handleShopPayConnect(localUser)
      case "bank":
        return handleBankConnect(localUser)
      case "wise":
        return handleWiseConnect(localUser)
      default:
        return new Response(
          JSON.stringify({ error: "Invalid payment provider" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" }
          }
        )
    }
  } catch (error) {
    console.error("Error connecting payment method:", error)
    return new Response(
      JSON.stringify({ error: "Failed to connect payment method" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    )
  }
}

// Provider-specific handlers
async function handleStripeConnect(user: any) {
  // TODO: Implement Stripe Connect OAuth flow
  const stripeConnectUrl = `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${process.env.STRIPE_CLIENT_ID}&scope=read_write&state=${user.id}`
  return new Response(JSON.stringify({ url: stripeConnectUrl }), {
    headers: { "Content-Type": "application/json" }
  })
}

async function handlePayPalConnect(user: any) {
  // TODO: Implement PayPal OAuth flow
  const paypalConnectUrl = `https://www.paypal.com/signin/authorize?client_id=${process.env.PAYPAL_CLIENT_ID}&response_type=code&scope=openid profile email&state=${user.id}`
  return new Response(JSON.stringify({ url: paypalConnectUrl }), {
    headers: { "Content-Type": "application/json" }
  })
}

async function handleGooglePayConnect(user: any) {
  // TODO: Implement Google Pay integration
  return new Response(
    JSON.stringify({
      url: "/account/payment-methods/google-pay-setup"
    }),
    { headers: { "Content-Type": "application/json" } }
  )
}

async function handleApplePayConnect(user: any) {
  // TODO: Implement Apple Pay integration
  return new Response(
    JSON.stringify({
      url: "/account/payment-methods/apple-pay-setup"
    }),
    { headers: { "Content-Type": "application/json" } }
  )
}

async function handleShopPayConnect(user: any) {
  // TODO: Implement Shop Pay integration
  return new Response(
    JSON.stringify({
      url: "/account/payment-methods/shop-pay-setup"
    }),
    { headers: { "Content-Type": "application/json" } }
  )
}

async function handleBankConnect(user: any) {
  // TODO: Implement bank account connection flow
  return new Response(
    JSON.stringify({
      url: "/account/payment-methods/bank-setup"
    }),
    { headers: { "Content-Type": "application/json" } }
  )
}

async function handleWiseConnect(user: any) {
  // TODO: Implement Wise Business integration
  const wiseConnectUrl = `https://api.wise.com/oauth/authorize?client_id=${process.env.WISE_CLIENT_ID}&response_type=code&scope=payments&state=${user.id}`
  return new Response(JSON.stringify({ url: wiseConnectUrl }), {
    headers: { "Content-Type": "application/json" }
  })
} 