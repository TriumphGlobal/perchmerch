import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Check if user is superadmin
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    if (user?.role !== 'SUPERADMIN') {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const body = await req.json()
    const { genres, reason = "Pre-banned inappropriate content" } = body

    if (!Array.isArray(genres)) {
      return new NextResponse("Invalid genres list", { status: 400 })
    }

    // Process each genre
    const results = await Promise.all(
      genres.map(async (name) => {
        try {
          // Check if genre exists
          const existingGenre = await db.genre.findFirst({
            where: {
              name: {
                equals: name,
                mode: 'insensitive'
              }
            }
          })

          if (existingGenre) {
            // Update existing genre
            await db.genre.update({
              where: { id: existingGenre.id },
              data: {
                isDeleted: true,
                isHidden: true,
                bannedReason: reason,
                bannedAt: new Date(),
                bannedBy: userId
              }
            })
            return { name, status: 'banned' }
          } else {
            // Create new pre-banned genre
            await db.genre.create({
              data: {
                name,
                createdBy: userId,
                isDeleted: true,
                isHidden: true,
                bannedReason: reason,
                bannedAt: new Date(),
                bannedBy: userId
              }
            })
            return { name, status: 'created-banned' }
          }
        } catch (error) {
          console.error(`Error processing genre ${name}:`, error)
          return { name, status: 'error' }
        }
      })
    )

    return NextResponse.json({
      success: true,
      results
    })
  } catch (error) {
    console.error('Error bulk banning genres:', error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 