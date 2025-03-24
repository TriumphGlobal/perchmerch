import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs"
import { db } from "@/lib/db"

export async function POST(
  req: Request,
  { params }: { params: { brandId: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { brandId } = params
    const { newOwnerEmail } = await req.json()

    // Get the brand and check ownership
    const brand = await db.brand.findUnique({
      where: { id: brandId }
    })

    if (!brand) {
      return new NextResponse("Brand not found", { status: 404 })
    }

    // Get the user's email from Clerk
    const { getUser } = auth()
    const user = await getUser()
    const userEmail = user?.emailAddresses[0]?.emailAddress

    if (!userEmail) {
      return new NextResponse("User email not found", { status: 400 })
    }

    // Only owner can transfer ownership
    if (brand.ownerEmail !== userEmail) {
      return new NextResponse("Unauthorized", { status: 403 })
    }

    // Cannot transfer to current owner
    if (newOwnerEmail === brand.ownerEmail) {
      return new NextResponse("Cannot transfer to current owner", { status: 400 })
    }

    // Transfer ownership
    await db.brand.update({
      where: { id: brandId },
      data: {
        ownerEmail: newOwnerEmail,
        managerEmails: [
          ...brand.managerEmails.filter(email => email !== newOwnerEmail),
          userEmail // Add current owner as manager
        ],
        brandAccess: {
          deleteMany: {
            where: {
              userEmail: newOwnerEmail
            }
          },
          create: [
            {
              userEmail: newOwnerEmail,
              role: "owner"
            },
            {
              userEmail: userEmail,
              role: "manager"
            }
          ]
        }
      }
    })

    return new NextResponse(null, { status: 200 })
  } catch (error) {
    console.error("[BRAND_TRANSFER]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 