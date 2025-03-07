import { NextRequest, NextResponse } from "next/server";
import * as stripeApi from "@/lib/api/stripe";

export async function POST(request: NextRequest) {
  try {
    const { action, ...data } = await request.json();
    
    if (!action) {
      return NextResponse.json(
        { error: "Missing action parameter" },
        { status: 400 }
      );
    }
    
    let result;
    
    switch (action) {
      case "create-customer":
        if (!data.customerData || !data.customerData.email) {
          return NextResponse.json(
            { error: "Missing customer email" },
            { status: 400 }
          );
        }
        result = await stripeApi.createCustomer(data.customerData);
        break;
        
      case "create-payment-intent":
        if (!data.paymentData || !data.paymentData.amount || !data.paymentData.currency) {
          return NextResponse.json(
            { error: "Missing required payment data" },
            { status: 400 }
          );
        }
        result = await stripeApi.createPaymentIntent(data.paymentData);
        break;
        
      case "create-checkout-session":
        if (
          !data.sessionData ||
          !data.sessionData.success_url ||
          !data.sessionData.cancel_url ||
          !data.sessionData.line_items ||
          !data.sessionData.mode
        ) {
          return NextResponse.json(
            { error: "Missing required session data" },
            { status: 400 }
          );
        }
        result = await stripeApi.createCheckoutSession(data.sessionData);
        break;
        
      case "create-connect-account":
        if (
          !data.accountData ||
          !data.accountData.type ||
          !data.accountData.country ||
          !data.accountData.email
        ) {
          return NextResponse.json(
            { error: "Missing required account data" },
            { status: 400 }
          );
        }
        result = await stripeApi.createConnectAccount(data.accountData);
        break;
        
      case "create-account-link":
        if (
          !data.linkData ||
          !data.linkData.account ||
          !data.linkData.refresh_url ||
          !data.linkData.return_url ||
          !data.linkData.type
        ) {
          return NextResponse.json(
            { error: "Missing required link data" },
            { status: 400 }
          );
        }
        result = await stripeApi.createAccountLink(data.linkData);
        break;
        
      case "create-transfer":
        if (
          !data.transferData ||
          !data.transferData.amount ||
          !data.transferData.currency ||
          !data.transferData.destination
        ) {
          return NextResponse.json(
            { error: "Missing required transfer data" },
            { status: 400 }
          );
        }
        result = await stripeApi.createTransfer(data.transferData);
        break;
        
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Stripe API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// Webhook handler
export async function PUT(request: NextRequest) {
  try {
    const signature = request.headers.get("stripe-signature");
    
    if (!signature) {
      return NextResponse.json(
        { error: "Missing Stripe signature" },
        { status: 400 }
      );
    }
    
    const body = await request.text();
    
    const event = stripeApi.verifyWebhookSignature(body, signature);
    
    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed":
        // Handle successful checkout
        console.log("Checkout completed:", event.data.object);
        break;
        
      case "payment_intent.succeeded":
        // Handle successful payment
        console.log("Payment succeeded:", event.data.object);
        break;
        
      case "payment_intent.payment_failed":
        // Handle failed payment
        console.log("Payment failed:", event.data.object);
        break;
        
      // Add more event handlers as needed
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 }
    );
  }
} 