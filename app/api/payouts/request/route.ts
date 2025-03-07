import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import { env } from "@/env.mjs";
import { Brand, Order, Affiliate } from "@prisma/client";

interface UserWithEarnings {
  stripeAccountId: string | null;
  Brand: Pick<Brand, 'totalEarnings'>[];
  referredUsers: {
    Order: Pick<Order, 'brandEarnings'>[];
  }[];
  Affiliate: (Pick<Affiliate, 'commissionRate'> & {
    Order: Pick<Order, 'brandEarnings'>[];
  })[];
}

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

    // Get user's total available earnings
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        stripeAccountId: true,
        Brand: {
          select: {
            totalEarnings: true,
          },
        },
        referredUsers: {
          select: {
            Order: {
              select: {
                brandEarnings: true,
              },
            },
          },
        },
        Affiliate: {
          select: {
            commissionRate: true,
            Order: {
              select: {
                brandEarnings: true,
              },
            },
          },
        },
      },
    }) as UserWithEarnings | null;

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    if (!user.stripeAccountId) {
      return new NextResponse(
        "Please set up your Stripe Connect account first",
        { status: 400 }
      );
    }

    // Calculate total available earnings
    const brandEarnings = user.Brand.reduce(
      (sum: number, brand: Pick<Brand, 'totalEarnings'>) => 
        sum + brand.totalEarnings,
      0
    );

    const referralEarnings = user.referredUsers.reduce((sum: number, referredUser) => {
      const userEarnings = referredUser.Order.reduce(
        (orderSum: number, order: Pick<Order, 'brandEarnings'>) => 
          orderSum + order.brandEarnings * 0.05,
        0
      );
      return sum + userEarnings;
    }, 0);

    const affiliateEarnings = user.Affiliate.reduce((sum: number, affiliate) => {
      const affiliateEarnings = affiliate.Order.reduce(
        (orderSum: number, order: Pick<Order, 'brandEarnings'>) =>
          orderSum + order.brandEarnings * affiliate.commissionRate,
        0
      );
      return sum + affiliateEarnings;
    }, 0);

    const totalAvailable =
      brandEarnings + referralEarnings + affiliateEarnings;

    if (totalAvailable < 1) {
      return new NextResponse(
        "Minimum payout amount is $1",
        { status: 400 }
      );
    }

    // Create a transfer to the user's connected account
    const transfer = await stripe.transfers.create({
      amount: Math.floor(totalAvailable * 100), // Convert to cents
      currency: "usd",
      destination: user.stripeAccountId,
    });

    // Update user's earnings records to mark them as paid
    // This would involve creating a payout record and updating the relevant earnings
    // TODO: Implement this in a transaction

    return NextResponse.json({
      success: true,
      transferId: transfer.id,
      amount: totalAvailable,
    });
  } catch (error) {
    console.error("Error processing payout request:", error);
    return new NextResponse(
      "Failed to process payout request",
      { status: 500 }
    );
  }
} 