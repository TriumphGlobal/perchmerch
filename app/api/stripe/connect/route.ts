import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import { env } from "@/env.mjs";

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-02-24.acacia",
});

export async function POST() {
  try {
    const session = await auth();
    if (!session?.userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userId = session.userId;

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        name: true,
        stripeAccountId: true,
      },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    if (user.stripeAccountId) {
      // Create an account link for existing account
      const accountLink = await stripe.accountLinks.create({
        account: user.stripeAccountId,
        refresh_url: `${env.NEXT_PUBLIC_APP_URL}/account/earnings?error=true`,
        return_url: `${env.NEXT_PUBLIC_APP_URL}/account/earnings?success=true`,
        type: "account_onboarding",
      });

      return NextResponse.json({ url: accountLink.url });
    }

    // Create a new Stripe Connect account
    const account = await stripe.accounts.create({
      type: "express",
      country: "US",
      email: user.email || undefined,
      business_type: "individual",
      capabilities: {
        transfers: { requested: true },
      },
      metadata: {
        userId: userId,
      },
    });

    // Update user with Stripe account ID
    await prisma.user.update({
      where: { id: userId },
      data: {
        stripeAccountId: account.id,
      },
    });

    // Create an account link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${env.NEXT_PUBLIC_APP_URL}/account/earnings?error=true`,
      return_url: `${env.NEXT_PUBLIC_APP_URL}/account/earnings?success=true`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error) {
    console.error("Error creating Stripe Connect account:", error);
    return new NextResponse(
      "Failed to create Stripe Connect account",
      { status: 500 }
    );
  }
} 