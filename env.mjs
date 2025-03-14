import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  server: {
    // Database
    DATABASE_URL: z.string().url(),
    
    // Authentication
    CLERK_SECRET_KEY: z.string().min(1),
    
    // Stripe API
    STRIPE_SECRET_KEY: z.string().min(1),
    STRIPE_WEBHOOK_SECRET: z.string().min(1),
    
    // OpenAI API
    OPENAI_API_KEY: z.string().min(1),
    
    // AWS S3
    AWS_ACCESS_KEY_ID: z.string().min(1),
    AWS_SECRET_ACCESS_KEY: z.string().min(1),
    AWS_REGION: z.string().min(1),
    AWS_BUCKET_NAME: z.string().min(1),
    
    // Printify API
    PRINTIFY_API_KEY: z.string().min(1),
    PRINTIFY_SHOP_ID: z.string().min(1),

    // Email (Resend)
    RESEND_API_KEY: z.string().min(1),
  },
  client: {
    // App
    NEXT_PUBLIC_APP_URL: z.string().url(),
    
    // Authentication
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
    
    // Stripe public key
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
    
    // Shopify API
    NEXT_PUBLIC_SHOPIFY_SHOP_NAME: z.string().min(1),
    NEXT_PUBLIC_SHOPIFY_ACCESS_TOKEN: z.string().min(1),
    
    // Printify API
    NEXT_PUBLIC_PRINTIFY_API_KEY: z.string().min(1),
  },
  runtimeEnv: {
    // App
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    
    // Database
    DATABASE_URL: process.env.DATABASE_URL,
    
    // Authentication
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    
    // Stripe API
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    
    // OpenAI API
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    
    // AWS S3
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_REGION: process.env.AWS_REGION,
    AWS_BUCKET_NAME: process.env.AWS_BUCKET_NAME,
    
    // Printify API
    PRINTIFY_API_KEY: process.env.PRINTIFY_API_KEY,
    PRINTIFY_SHOP_ID: process.env.PRINTIFY_SHOP_ID,
    NEXT_PUBLIC_PRINTIFY_API_KEY: process.env.NEXT_PUBLIC_PRINTIFY_API_KEY,
    
    // Shopify API
    NEXT_PUBLIC_SHOPIFY_SHOP_NAME: process.env.NEXT_PUBLIC_SHOPIFY_SHOP_NAME,
    NEXT_PUBLIC_SHOPIFY_ACCESS_TOKEN: process.env.NEXT_PUBLIC_SHOPIFY_ACCESS_TOKEN,

    // Email (Resend)
    RESEND_API_KEY: process.env.RESEND_API_KEY,
  },
}) 