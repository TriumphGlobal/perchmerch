import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { env } from "@/env.mjs";
import { prisma } from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-02-24.acacia",
});

type StripeEvent = Stripe.Event & {
  type: "account.updated" | "transfer.created" | "transfer.failed";
};

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("stripe-signature");

  if (!signature) {
    return new NextResponse("No signature", { status: 400 });
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    ) as StripeEvent;

    switch (event.type) {
      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        const userId = account.metadata?.userId;

        if (!userId) {
          console.error("No userId in account metadata");
          return new NextResponse("No userId in account metadata", { status: 400 });
        }

        // Update user's Stripe account details
        await prisma.user.update({
          where: { id: userId },
          data: {
            stripeAccountId: account.id,
            stripeAccountStatus: account.charges_enabled ? "active" : "pending",
          },
        });
        break;
      }

      case "transfer.created": {
        const transfer = event.data.object as Stripe.Transfer;
        const destinationAccount = transfer.destination as string;

        // Find user by Stripe account ID
        const user = await prisma.user.findFirst({
          where: { stripeAccountId: destinationAccount },
          select: { id: true },
        });

        if (!user) {
          console.error("No user found for Stripe account", destinationAccount);
          return new NextResponse("User not found", { status: 404 });
        }

        // Create payout record
        await prisma.payout.create({
          data: {
            userId: user.id,
            amount: transfer.amount / 100, // Convert from cents to dollars
            stripeTransferId: transfer.id,
            status: "completed",
          },
        });

        // Update earnings records to mark them as paid
        await prisma.$transaction(async (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'>) => {
          // Update brand earnings
          await tx.brand.updateMany({
            where: {
              userId: user.id,
              totalEarnings: { gt: 0 },
            },
            data: {
              totalEarnings: 0,
            },
          });

          // Update affiliate earnings
          await tx.affiliate.updateMany({
            where: {
              userId: user.id,
              Order: {
                some: {
                  brandEarnings: { gt: 0 },
                },
              },
            },
            data: {
              Order: {
                updateMany: {
                  where: {
                    brandEarnings: { gt: 0 },
                  },
                  data: {
                    brandEarnings: 0,
                  },
                },
              },
            },
          });

          // Update referral earnings
          await tx.order.updateMany({
            where: {
              user: {
                referrerId: user.id,
              },
              brandEarnings: { gt: 0 },
            },
            data: {
              brandEarnings: 0,
            },
          });
        });
        break;
      }

      case "transfer.failed": {
        const transfer = event.data.object as Stripe.Transfer & {
          failure_message?: string;
        };
        const destinationAccount = transfer.destination as string;

        // Find user by Stripe account ID
        const user = await prisma.user.findFirst({
          where: { stripeAccountId: destinationAccount },
          select: { id: true },
        });

        if (!user) {
          console.error("No user found for Stripe account", destinationAccount);
          return new NextResponse("User not found", { status: 404 });
        }

        // Update payout record
        await prisma.payout.update({
          where: {
            stripeTransferId: transfer.id,
          },
          data: {
            status: "failed",
            failureReason: transfer.failure_message || "Unknown error",
          },
        });
        break;
      }
    }

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error("Error handling webhook:", error);
    return new NextResponse(
      "Failed to handle webhook",
      { status: 500 }
    );
  }
} 