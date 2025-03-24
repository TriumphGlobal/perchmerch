import { db } from "@/lib/db"
import { auth, currentUser } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

export async function POST(
  req: Request,
  { params }: { params: { brandId: string } }
) {
  try {
    const [session, clerkUser] = await Promise.all([
      auth(),
      currentUser()
    ])

    if (!session || !clerkUser) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress
    if (!email) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { email: inviteeEmail, role } = await req.json()

    // Check if user has permission to invite
    const userAccess = await db.brandAccess.findFirst({
      where: {
        brandId: params.brandId,
        userEmail: email,
        role: {
          in: ["owner", "manager"]
        }
      }
    })

    if (!userAccess) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Only owners can add other owners
    if (role === "owner" && userAccess.role !== "owner") {
      return new NextResponse("Only owners can add other owners", { status: 403 })
    }

    // Check if invitee already has access
    const existingAccess = await db.brandAccess.findFirst({
      where: {
        brandId: params.brandId,
        userEmail: inviteeEmail
      }
    })

    if (existingAccess) {
      return new NextResponse("User already has access to this brand", { status: 400 })
    }

    // Create brand access record
    await db.brandAccess.create({
      data: {
        brandId: params.brandId,
        userEmail: inviteeEmail,
        role: role as "owner" | "manager"
      }
    })

    return new NextResponse("Team member added successfully", { status: 200 })
  } catch (error) {
    console.error("[BRAND_TEAM_POST]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { brandId: string } }
) {
  try {
    const [session, clerkUser] = await Promise.all([
      auth(),
      currentUser()
    ])

    if (!session || !clerkUser) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress
    if (!email) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { email: targetEmail } = await req.json()

    // Check if user has permission to remove team members
    const userAccess = await db.brandAccess.findFirst({
      where: {
        brandId: params.brandId,
        userEmail: email,
        role: {
          in: ["owner", "manager"]
        }
      }
    })

    if (!userAccess) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Get target user's access record
    const targetAccess = await db.brandAccess.findFirst({
      where: {
        brandId: params.brandId,
        userEmail: targetEmail
      }
    })

    if (!targetAccess) {
      return new NextResponse("Team member not found", { status: 404 })
    }

    // Only owners can remove owners
    if (targetAccess.role === "owner" && userAccess.role !== "owner") {
      return new NextResponse("Only owners can remove other owners", { status: 403 })
    }

    // Cannot remove yourself if you're the last owner
    if (targetEmail === email && targetAccess.role === "owner") {
      const ownerCount = await db.brandAccess.count({
        where: {
          brandId: params.brandId,
          role: "owner"
        }
      })

      if (ownerCount === 1) {
        return new NextResponse("Cannot remove the last owner", { status: 400 })
      }
    }

    // Delete brand access record
    await db.brandAccess.delete({
      where: {
        id: targetAccess.id
      }
    })

    return new NextResponse("Team member removed successfully", { status: 200 })
  } catch (error) {
    console.error("[BRAND_TEAM_DELETE]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 