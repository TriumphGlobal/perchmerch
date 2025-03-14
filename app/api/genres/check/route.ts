import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { db } from '@/lib/db'

// List of pre-banned words and patterns
const BANNED_PATTERNS = [
  // Profanity and inappropriate content
  /fuck/i, /shit/i, /ass/i, /bitch/i, /cunt/i, /dick/i, /pussy/i, /cock/i,
  // Hate speech and discrimination
  /nazi/i, /hitler/i, /racist/i, /nigger/i, /faggot/i,
  // Violence
  /gore/i, /murder/i, /kill/i, /rape/i,
  // Drug references
  /cocaine/i, /heroin/i, /meth/i,
  // Generic inappropriate patterns
  /^sex/i, /porn/i, /nsfw/i,
  // Numbers only
  /^\d+$/,
  // Single characters
  /^.$/
]

export async function POST(req: Request) {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const { name } = body

    if (!name || typeof name !== 'string') {
      return new NextResponse("Invalid genre name", { status: 400 })
    }

    // Check against banned patterns
    if (BANNED_PATTERNS.some(pattern => pattern.test(name))) {
      return NextResponse.json({
        success: true,
        allowed: false,
        reason: "This genre name contains inappropriate content"
      })
    }

    // Check against banned genres in database
    const bannedGenre = await db.genre.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive'
        },
        isDeleted: true
      }
    })

    if (bannedGenre) {
      return NextResponse.json({
        success: true,
        allowed: false,
        reason: "This genre name is not allowed"
      })
    }

    // Check for similar existing genres to prevent duplicates
    const similarGenre = await db.genre.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive'
        }
      }
    })

    if (similarGenre) {
      return NextResponse.json({
        success: true,
        allowed: false,
        reason: "This genre already exists"
      })
    }

    return NextResponse.json({
      success: true,
      allowed: true
    })
  } catch (error) {
    console.error('Error checking genre:', error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 