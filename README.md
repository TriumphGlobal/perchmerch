# PerchMerch

A platform that enables creators to build their own brand stores with Shopify integration and affiliate marketing capabilities.

## Features

- Brand Creation & Management
- Shopify Integration
- Affiliate Program Management
- Commission Tracking
- Custom Store URLs (perchmerch.com/brand)
- Affiliate Link Generation (perchmerch.com/brand?ref=affiliateId)
- Real-time Analytics

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Prisma (PostgreSQL)
- Shopify API
- NextAuth.js
- TailwindCSS
- Stripe (for payouts)

## Prerequisites

- Node.js 18+
- PostgreSQL database
- Shopify Partner account
- Stripe account

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/perchmerch"

# Auth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Shopify
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN="your-store.myshopify.com"
NEXT_PUBLIC_SHOPIFY_STOREFRONT_API_KEY="your-storefront-api-key"
SHOPIFY_ADMIN_API_KEY="your-admin-api-key"
SHOPIFY_ADMIN_API_SECRET="your-admin-api-secret"

# Stripe
STRIPE_SECRET_KEY="your-stripe-secret-key"
STRIPE_WEBHOOK_SECRET="your-stripe-webhook-secret"
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

3. Configure Shopify:
- Create a Shopify Partner account
- Create a new app in the Shopify Partner dashboard
- Configure app credentials in `.env`
- Set up webhooks for order processing

4. Configure Stripe:
- Create a Stripe account
- Set up webhook endpoints
- Add API keys to `.env`

5. Start the development server:
```bash
npm run dev
```

## Deployment

1. Set up a production database
2. Configure environment variables in your hosting platform
3. Deploy using the platform's deployment process

Example with Vercel:
```bash
vercel --prod
```

## Shopify Setup

1. Create Custom App:
   - Go to Shopify Partner dashboard
   - Create new app
   - Configure Admin API access
   - Set up Storefront API
   - Add webhook endpoints

2. Configure Webhooks:
   - Orders create/update
   - Products create/update
   - Collections create/update

3. Set up App Bridge:
   - Configure authentication
   - Set up API permissions

## Commission Structure

- Platform fee: 50% of profit
- Remaining 50% split:
  - Brand owner: 25%
  - Affiliate: 25%

## Development

- Run tests: `npm test`
- Format code: `npm run format`
- Lint code: `npm run lint`
- Type check: `npm run type-check`

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is proprietary and confidential. #   p e r c h m e r c h  
 