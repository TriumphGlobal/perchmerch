import { headers } from "next/headers"
import { WebhookEvent } from "@clerk/nextjs/server"
import { Webhook } from "svix"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occured -- no svix headers", {
      status: 400
    });
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || "");

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occured", {
      status: 400
    })
  }

  // Handle the webhook
  const eventType = evt.type;

  if (eventType === "user.created") {
    const { id, email_addresses, unsafe_metadata } = evt.data;
    const email = email_addresses[0]?.email_address;
    const platformReferralLinkId = unsafe_metadata?.platformReferralLinkId as string;

    if (!email) {
      return new Response("No email found", { status: 400 });
    }

    try {
      // If platformReferralLinkId exists, get the referrer's email
      let referrerEmail = null;
      if (platformReferralLinkId) {
        const referralLink = await db.platformReferralLink.findUnique({
          where: { code: platformReferralLinkId },
          select: { user: { select: { email: true } } }
        });
        referrerEmail = referralLink?.user?.email || null;
      }

      // Create user in local DB
      await db.user.create({
        data: {
          email,
          name: null,
          role: 'user',
          platformReferredByEmail: referrerEmail,
          platformReferredEmails: [],
          platformReferralEarnings: 0,
          brandIds: [],
          orderIds: [],
          affiliateLinks: []
        }
      });

      // If there's a referrer, update their platformReferredEmails and create PlatformReferral record
      if (referrerEmail && platformReferralLinkId) {
        await Promise.all([
          db.user.update({
            where: { email: referrerEmail },
            data: {
              platformReferredEmails: {
                push: email
              }
            }
          }),
          db.platformReferral.create({
            data: {
              platformReferredByEmail: referrerEmail,
              platformReferredEmail: email,
              platformReferralLinkId,
              earnings: 0
            }
          })
        ]);
      }

      return new Response("User created in local DB", { status: 200 });
    } catch (error) {
      console.error("Error creating user in local DB:", error);
      return new Response("Error creating user in local DB", { status: 500 });
    }
  }

  return new Response("Webhook received", { status: 200 });
} 