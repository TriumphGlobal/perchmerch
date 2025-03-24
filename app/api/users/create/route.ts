import { auth } from "@clerk/nextjs/server"
import { db } from "../../../../lib/db"

export async function POST(req: Request) {
  try {
    const { email, platformReferralLinkId } = await req.json()

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: "User already exists" }),
        { status: 400 }
      )
    }

    let referrerEmail = null

    // If platformReferralLinkId is provided, validate it
    if (platformReferralLinkId) {
      // Find the referral link and check if it's active
      const referralLink = await db.platformReferralLink.findUnique({
        where: { code: platformReferralLinkId },
        select: { 
          id: true,
          isActive: true,
          email: true,
          platformReferrals: {
            select: {
              platformReferredEmail: true
            }
          }
        }
      })

      // Check if link exists and is active
      if (!referralLink) {
        return new Response(
          JSON.stringify({ error: "Invalid referral link" }),
          { status: 400 }
        )
      }

      if (!referralLink.isActive) {
        return new Response(
          JSON.stringify({ error: "This referral link is no longer active" }),
          { status: 400 }
        )
      }

      // Check if the link has already been used by this email
      const existingReferral = referralLink.platformReferrals.find(
        ref => ref.platformReferredEmail === email
      )

      if (existingReferral) {
        return new Response(
          JSON.stringify({ error: "This referral link has already been used by this email" }),
          { status: 400 }
        )
      }

      referrerEmail = referralLink.email
    }

    // Create user in local DB
    const newUser = await db.user.create({
      data: {
        email,
        name: null,
        role: 'user',
        platformReferredByEmail: referrerEmail,
        platformReferredEmails: [],
        platformReferralEarnings: 0,
        orderIds: [],
      }
    })

    // If there's a referrer and valid referral link, update referral data
    if (referrerEmail && platformReferralLinkId) {
      const referralLink = await db.platformReferralLink.findUnique({
        where: { code: platformReferralLinkId },
        select: { id: true }
      })

      if (referralLink) {
        await Promise.all([
          db.user.update({
            where: { email: referrerEmail },
            data: {
              platformReferredEmails: {
                push: email
              }
            }
          }),
          db.platformReferral.create({
            data: {
              platformReferredByEmail: referrerEmail,
              platformReferredEmail: email,
              platformReferralLinkId: referralLink.id,
              earnings: 0
            }
          })
        ])
      }
    }

    return new Response(
      JSON.stringify(newUser),
      { 
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("Error creating user:", error)
    return new Response(
      JSON.stringify({ 
        error: "Failed to create user",
        details: error instanceof Error ? error.message : "Unknown error"
      }), 
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    )
  }
} 