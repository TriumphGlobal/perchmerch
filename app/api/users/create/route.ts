import { auth } from "@clerk/nextjs/server"
import { db } from "../../../lib/db"

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
        { 
          status: 409,
          headers: { "Content-Type": "application/json" }
        }
      )
    }

    // If platformReferralLinkId exists, get the referrer's email and referral link
    let referrerEmail = null
    let referralLink = null
    if (platformReferralLinkId) {
      referralLink = await db.platformReferralLink.findUnique({
        where: { code: platformReferralLinkId },
        select: { 
          id: true,
          user: { select: { email: true } } 
        }
      })
      referrerEmail = referralLink?.user?.email || null
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
        brandIds: [],
        orderIds: [],
        affiliateLinks: []
      }
    })

    // If there's a referrer and valid referral link, update referral data
    if (referrerEmail && referralLink?.id) {
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
            platformReferralLinkId: referralLink.id, // Use the link's ID here
            earnings: 0
          }
        })
      ])
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