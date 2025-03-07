import { env } from "@/env.mjs";
import Stripe from "stripe";

// Initialize Stripe client
const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

/**
 * Create a new customer in Stripe
 */
export async function createCustomer(customerData: {
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}) {
  try {
    return await stripe.customers.create(customerData);
  } catch (error) {
    console.error("Error creating Stripe customer:", error);
    throw error;
  }
}

/**
 * Create a payment intent
 */
export async function createPaymentIntent(paymentData: {
  amount: number; // in cents
  currency: string;
  customer?: string;
  receipt_email?: string;
  metadata?: Record<string, string>;
  description?: string;
}) {
  try {
    return await stripe.paymentIntents.create(paymentData);
  } catch (error) {
    console.error("Error creating payment intent:", error);
    throw error;
  }
}

/**
 * Create a checkout session
 */
export async function createCheckoutSession(sessionData: {
  success_url: string;
  cancel_url: string;
  payment_method_types?: string[];
  mode: "payment" | "subscription" | "setup";
  line_items: Array<{
    price_data?: {
      currency: string;
      product_data: {
        name: string;
        description?: string;
        images?: string[];
        metadata?: Record<string, string>;
      };
      unit_amount: number; // in cents
    };
    quantity: number;
  }>;
  customer?: string;
  customer_email?: string;
  metadata?: Record<string, string>;
}) {
  try {
    return await stripe.checkout.sessions.create(sessionData);
  } catch (error) {
    console.error("Error creating checkout session:", error);
    throw error;
  }
}

/**
 * Retrieve a checkout session
 */
export async function getCheckoutSession(sessionId: string) {
  try {
    return await stripe.checkout.sessions.retrieve(sessionId);
  } catch (error) {
    console.error("Error retrieving checkout session:", error);
    throw error;
  }
}

/**
 * Create a Connect account for a seller
 */
export async function createConnectAccount(accountData: {
  type: "standard" | "express" | "custom";
  country: string;
  email: string;
  business_type?: "individual" | "company";
  business_profile?: {
    name?: string;
    url?: string;
  };
  metadata?: Record<string, string>;
}) {
  try {
    return await stripe.accounts.create(accountData);
  } catch (error) {
    console.error("Error creating Connect account:", error);
    throw error;
  }
}

/**
 * Create an account link for onboarding
 */
export async function createAccountLink(linkData: {
  account: string;
  refresh_url: string;
  return_url: string;
  type: "account_onboarding" | "account_update";
}) {
  try {
    return await stripe.accountLinks.create(linkData);
  } catch (error) {
    console.error("Error creating account link:", error);
    throw error;
  }
}

/**
 * Create a transfer to a connected account
 */
export async function createTransfer(transferData: {
  amount: number; // in cents
  currency: string;
  destination: string; // connected account ID
  transfer_group?: string;
  metadata?: Record<string, string>;
  description?: string;
}) {
  try {
    return await stripe.transfers.create(transferData);
  } catch (error) {
    console.error("Error creating transfer:", error);
    throw error;
  }
}

/**
 * Verify a webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
) {
  try {
    return stripe.webhooks.constructEvent(
      payload,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error("Error verifying webhook signature:", error);
    throw error;
  }
} 