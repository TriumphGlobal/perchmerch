# PerchMerch API Setup Guide

This guide will walk you through setting up all the necessary API integrations for the PerchMerch platform.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [OpenAI API Setup](#openai-api-setup)
4. [Shopify API Setup](#shopify-api-setup)
5. [Printify API Setup](#printify-api-setup)
6. [Stripe API Setup](#stripe-api-setup)
7. [AWS S3 Setup](#aws-s3-setup)
8. [Testing Your Setup](#testing-your-setup)

## Prerequisites

Before you begin, make sure you have:

- Node.js 18+ installed
- npm or yarn installed
- Git installed
- A code editor (VS Code recommended)
- Accounts with all the services (OpenAI, Shopify, Printify, Stripe, AWS)

## Environment Setup

1. Create a `.env.local` file in the root of your project with the following variables:

```
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/perchmerch"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-key"

# OpenAI API (for product descriptions, etc.)
OPENAI_API_KEY="your-openai-api-key"

# Shopify API
SHOPIFY_ADMIN_API_KEY="your-shopify-admin-api-key"
SHOPIFY_ADMIN_API_SECRET="your-shopify-admin-api-secret"
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN="your-store.myshopify.com"
NEXT_PUBLIC_SHOPIFY_STOREFRONT_API_KEY="your-shopify-storefront-api-key"

# Printify API
PRINTIFY_API_KEY="your-printify-api-key"
PRINTIFY_SHOP_ID="your-printify-shop-id"

# Stripe API
STRIPE_SECRET_KEY="your-stripe-secret-key"
STRIPE_WEBHOOK_SECRET="your-stripe-webhook-secret"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="your-stripe-publishable-key"

# AWS S3 (for image storage)
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="us-east-1"
AWS_BUCKET_NAME="perchmerch-uploads"
```

2. Install the required dependencies:

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner next-auth openai @stripe/stripe-js stripe @prisma/client axios
```

## OpenAI API Setup

1. Go to [OpenAI API](https://platform.openai.com/sign-up) and create an account
2. Navigate to the API section and create a new API key
3. Copy the API key and add it to your `.env.local` file as `OPENAI_API_KEY`

## Shopify API Setup

1. Go to [Shopify Partners](https://partners.shopify.com/) and create an account
2. Create a new development store or use an existing one
3. Go to Apps > Develop apps > Create an app
4. Configure the app with the necessary scopes (read/write products, read/write orders, etc.)
5. Get your API credentials and add them to your `.env.local` file:
   - `SHOPIFY_ADMIN_API_KEY`
   - `SHOPIFY_ADMIN_API_SECRET`
   - `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN`
   - `NEXT_PUBLIC_SHOPIFY_STOREFRONT_API_KEY`

## Printify API Setup

1. Go to [Printify](https://printify.com/) and create an account
2. Navigate to your profile settings
3. Go to the API section and generate a new API key
4. Copy the API key and add it to your `.env.local` file as `PRINTIFY_API_KEY`
5. Get your Shop ID from the Printify dashboard and add it as `PRINTIFY_SHOP_ID`

## Stripe API Setup

1. Go to [Stripe](https://stripe.com/) and create an account
2. Navigate to the Developers > API keys section
3. Get your API keys and add them to your `.env.local` file:
   - `STRIPE_SECRET_KEY`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
4. Set up a webhook endpoint in the Stripe dashboard:
   - Endpoint URL: `https://your-domain.com/api/stripe` (use ngrok for local testing)
   - Events to listen for: `checkout.session.completed`, `payment_intent.succeeded`, etc.
5. Get your webhook signing secret and add it as `STRIPE_WEBHOOK_SECRET`

## AWS S3 Setup

1. Go to [AWS](https://aws.amazon.com/) and create an account
2. Navigate to the IAM service and create a new user with programmatic access
3. Attach the `AmazonS3FullAccess` policy to the user
4. Get the access key and secret key and add them to your `.env.local` file:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
5. Go to the S3 service and create a new bucket
6. Configure the bucket for public access (for storing product images)
7. Add the bucket name and region to your `.env.local` file:
   - `AWS_BUCKET_NAME`
   - `AWS_REGION`

## Testing Your Setup

After setting up all the APIs, you can test them with the following commands:

1. Start the development server:

```bash
npm run dev
```

2. Test the OpenAI integration:
   - Go to `/api/openai` and make a POST request with:
   ```json
   {
     "action": "generate-text",
     "prompt": "Write a short product description for a t-shirt"
   }
   ```

3. Test the Printify integration:
   - Go to `/api/printify?action=print-providers` to get a list of print providers

4. Test the S3 integration:
   - Go to `/api/upload` and upload a test image using a form with a file input named "file"

5. Test the Stripe integration:
   - Go to `/api/stripe` and make a POST request with:
   ```json
   {
     "action": "create-customer",
     "customerData": {
       "email": "test@example.com",
       "name": "Test Customer"
     }
   }
   ```

## Troubleshooting

If you encounter any issues:

1. Check your API keys and make sure they're correctly set in the `.env.local` file
2. Ensure your Shopify app has the necessary scopes
3. Verify your AWS S3 bucket permissions
4. Check the server logs for any error messages
5. Make sure all dependencies are installed correctly

For more detailed information, refer to each service's API documentation. 