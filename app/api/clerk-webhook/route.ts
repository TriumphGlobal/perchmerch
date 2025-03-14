import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const SUPERADMIN_EMAIL = "sales@triumphglobal.net"

export async function POST(req: Request) {
  // Get the webhook signature from the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no webhook signatures, return 400
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Missing svix headers', { status: 400 })
  }

  // Get the webhook secret from environment variables
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET

  // If there's no webhook secret, return 500
  if (!webhookSecret) {
    return new Response('Missing webhook secret', { status: 500 })
  }

  // Get the request body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Create a new Webhook instance with the secret
  const webhook = new Webhook(webhookSecret)

  let event: WebhookEvent

  try {
    // Verify the webhook signature
    event = webhook.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error verifying webhook', { status: 400 })
  }

  // Handle the webhook event
  const eventType = event.type

  if (eventType === 'user.created') {
    const { id, email_addresses, username, first_name, last_name, image_url } = event.data

    const email = email_addresses && email_addresses[0]?.email_address

    if (!email) {
      return new Response('User has no email address', { status: 400 })
    }

    // Check if this is the first user or the superadmin email
    const userCount = await prisma.user.count()
    const isSuperAdmin = email === SUPERADMIN_EMAIL
    const shouldBeSuperAdmin = isSuperAdmin || userCount === 0

    try {
      // Check if user already exists in our database
      const existingUser = await prisma.user.findUnique({
        where: { id: id }
      })

      if (existingUser) {
        return new Response('User already exists', { status: 200 })
      }

      // Create the user in our database exactly matching the schema fields
      await prisma.user.create({
        data: {
          id: id,
          name: `${first_name || ''} ${last_name || ''}`.trim() || username || 'User',
          email: email,
          image: image_url,
          role: shouldBeSuperAdmin ? "superAdmin" : "user",
          isPlatformAdmin: shouldBeSuperAdmin,
          isSuperAdmin: shouldBeSuperAdmin,
        }
      })

      // Log the activity
      await prisma.userActivity.create({
        data: {
          userId: id,
          type: shouldBeSuperAdmin ? "SUPERADMIN_CREATED" : "USER_CREATED",
          details: JSON.stringify({ email })
        }
      })

      console.log(`User created: ${id} (${email}) - ${shouldBeSuperAdmin ? 'SuperAdmin' : 'User'}`)
      return new Response('User created successfully', { status: 200 })
    } catch (error) {
      console.error('Error creating user:', error)
      return new Response(`Error creating user: ${error}`, { status: 500 })
    }
  }

  // Return a 200 response for all other event types
  return new Response('Webhook received', { status: 200 })
} 