import { PrismaClient } from '@prisma/client'
import { auth } from '@clerk/nextjs'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()
const SUPERADMIN_EMAIL = "sales@triumphglobal.net"

/**
 * This API endpoint is specifically for initializing the superAdmin account.
 * It will look for the user with the specified email and grant superAdmin privileges.
 */
export async function GET(req: Request) {
  try {
    // Get the current user's session
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized - Please sign in'
      }, { status: 401 })
    }

    // Find the current user
    const currentUser = await prisma.user.findFirst({
      where: {
        id: userId
      }
    })

    if (!currentUser) {
      return NextResponse.json({
        success: false,
        message: 'User not found in database'
      }, { status: 404 })
    }

    // Check if the current user's email matches the superAdmin email
    if (currentUser.email !== SUPERADMIN_EMAIL) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized - Only the designated superAdmin email can initialize superAdmin privileges'
      }, { status: 403 })
    }

    console.log("Initializing superAdmin account for email:", SUPERADMIN_EMAIL)

    // Check if user already has superAdmin privileges
    if (currentUser.role === "superAdmin" && currentUser.isSuperAdmin && currentUser.isPlatformAdmin) {
      console.log("User already has superAdmin privileges")
      return NextResponse.json({
        success: true,
        message: `User ${SUPERADMIN_EMAIL} already has superAdmin privileges`,
        user: {
          id: currentUser.id,
          email: currentUser.email,
          role: currentUser.role,
          isSuperAdmin: currentUser.isSuperAdmin,
          isPlatformAdmin: currentUser.isPlatformAdmin
        }
      }, { status: 200 })
    }

    // Update the user with superAdmin privileges
    const updatedUser = await prisma.user.update({
      where: {
        id: currentUser.id
      },
      data: {
        role: "superAdmin",
        isPlatformAdmin: true,
        isSuperAdmin: true
      }
    })

    console.log("User updated with superAdmin privileges:", {
      id: updatedUser.id,
      role: updatedUser.role,
      isSuperAdmin: updatedUser.isSuperAdmin,
      isPlatformAdmin: updatedUser.isPlatformAdmin
    })

    // Log the activity
    await prisma.userActivity.create({
      data: {
        userId: currentUser.id,
        type: "SUPERADMIN_INITIALIZED",
        details: JSON.stringify({
          email: SUPERADMIN_EMAIL,
          timestamp: new Date().toISOString(),
          changes: {
            role: "superAdmin",
            isPlatformAdmin: true,
            isSuperAdmin: true
          }
        })
      }
    })

    return NextResponse.json({
      success: true,
      message: `User ${SUPERADMIN_EMAIL} has been granted superAdmin privileges`,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        isSuperAdmin: updatedUser.isSuperAdmin,
        isPlatformAdmin: updatedUser.isPlatformAdmin
      }
    }, { status: 200 })
  } catch (error) {
    console.error('Error initializing superAdmin:', error)
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 })
  }
} 