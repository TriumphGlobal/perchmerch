"use server"

import { db } from "@/lib/db"
import type { DBUser } from "@/types/localDbU"

export async function createLocalUser(data: {
  email: string
  firstName: string | null
  lastName: string | null
  phoneNumber: string | null
  address1: string | null
  address2: string | null
  city: string | null
  state: string | null
  postalCode: string | null
  country: string | null
  platformReferredByEmail: string | null
  role?: string
}) {
  try {
    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: data.email }
    })

    if (existingUser) {
      return existingUser
    }

    // If platformReferredByEmail is provided, verify it exists
    let verifiedReferrer = null
    if (data.platformReferredByEmail) {
      verifiedReferrer = await db.user.findUnique({
        where: { email: data.platformReferredByEmail }
      })
    }

    // Create new user
    const newUser = await db.user.create({
      data: {
        email: data.email,
        name: `${data.firstName} ${data.lastName}`.trim() || null,
        role: data.role || 'user',
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        address1: data.address1,
        address2: data.address2,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country,
        platformReferredByEmail: verifiedReferrer ? data.platformReferredByEmail : null,
        platformReferredEmails: [],
        platformReferralEarnings: 0,
        brandIds: [],
        orderIds: [],
        affiliateLinks: []
      }
    })

    // If there's a valid referrer, update their platformReferredEmails
    if (verifiedReferrer) {
      await db.user.update({
        where: { email: verifiedReferrer.email },
        data: {
          platformReferredEmails: {
            push: data.email
          }
        }
      })
    }

    return newUser
  } catch (error) {
    console.error('Error creating local user:', error)
    throw error
  }
} 