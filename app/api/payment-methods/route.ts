import { auth } from "@clerk/nextjs/server"
import { currentUser } from "@clerk/nextjs/server"
import { NextRequest } from "next/server"
import { db } from "../../../lib/db"

export async function POST(req: NextRequest) {
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

    const body = await req.json()
    const { provider, ...paymentDetails } = body

    if (!provider) {
      return new Response(JSON.stringify({ error: "Provider is required" }), {
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
    const existingPaymentMethod = await db.paymentMethod.findFirst({
      where: {
        userId: localUser.id,
        provider
      }
    })

    if (existingPaymentMethod) {
      return new Response(
        JSON.stringify({ error: "Payment method already exists" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      )
    }

    // Create payment method
    const paymentMethod = await db.paymentMethod.create({
      data: {
        userId: localUser.id,
        provider,
        type: getPaymentMethodType(provider),
        metadata: paymentDetails,
        isDefault: false
      }
    })

    return new Response(JSON.stringify(paymentMethod), {
      headers: { "Content-Type": "application/json" }
    })
  } catch (error) {
    console.error("Error creating payment method:", error)
    return new Response(
      JSON.stringify({ error: "Failed to create payment method" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    )
  }
}

export async function GET(req: NextRequest) {
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

    // Get all payment methods for the user
    const paymentMethods = await db.paymentMethod.findMany({
      where: {
        userId: localUser.id
      }
    })

    return new Response(JSON.stringify(paymentMethods), {
      headers: { "Content-Type": "application/json" }
    })
  } catch (error) {
    console.error("Error fetching payment methods:", error)
    return new Response(
      JSON.stringify({ error: "Failed to fetch payment methods" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    )
  }
}

function getPaymentMethodType(provider: string): "pay" | "receive" | "both" {
  switch (provider) {
    case "stripe":
    case "paypal":
      return "both"
    case "google-pay":
    case "apple-pay":
    case "shop-pay":
      return "pay"
    case "bank":
    case "wise":
      return "receive"
    default:
      return "pay"
  }
} 