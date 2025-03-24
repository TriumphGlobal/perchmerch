import { auth } from "@clerk/nextjs/server"
import { db } from "../../../lib/db"
import { NextResponse } from "next/server"

export async function PUT(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const {
      email,
      paypalEmail,
      businessName,
      businessType,
      taxId,
    } = await req.json()

    const updatedUser = await db.user.update({
      where: { email },
      data: {
        paypalEmail,
        businessName,
        businessType,
        taxId,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Error updating payment information:", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 