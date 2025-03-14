import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs"
import prisma from "@/lib/prisma"
import { nanoid } from "nanoid"
import { sendEmail, emailTemplates } from "@/lib/email"

export async function POST() {
  try {
    const { userId } = auth()

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Check if user has reached the limit of 5 referral links
    const existingLinks = await prisma.referralLink.count({
      where: { userId }
    })

    if (existingLinks >= 5) {
      return new NextResponse("Maximum number of referral links reached (5)", { status: 400 })
    }

    // Get user's email from Clerk
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    })

    if (!user?.email) {
      return new NextResponse("User email not found", { status: 400 })
    }

    // Generate a unique referral code
    const code = nanoid(10)

    // Create the referral link
    const referralLink = await prisma.referralLink.create({
      data: {
        code,
        userId
      }
    })

    // Send email with the referral link
    const { subject, html } = emailTemplates.newReferralLink(
      code,
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    )
    
    await sendEmail({
      to: user.email,
      subject,
      html
    })

    return NextResponse.json({ success: true, code })
  } catch (error) {
    console.error("[REFERRAL_GENERATE]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 