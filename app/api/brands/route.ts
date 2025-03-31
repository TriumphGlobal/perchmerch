import { auth, currentUser } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { Brand, User } from "@prisma/client"
import { z } from "zod"

interface BrandWithDetails extends Brand {
  access: Array<{
    id: string;
    userId: string;
    role: string;
    user: {
      id: string;
      email: string;
      name: string | null;
    };
  }>;
  _count?: {
    products: number;
  };
}

interface UserWithBrands extends User {
  brandAccess: {
    id: string;
    brandId: string;
    role: string;
    brand: Brand;
  }[];
}

const createBrandSchema = z.object({
  name: z.string().min(1, "Brand name is required"),
  description: z.string().optional().nullable(),
  tagline: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  colors: z.array(z.string()).optional().nullable(),
  website: z.string().optional().nullable(),
  facebook: z.string().optional().nullable(),
  twitter: z.string().optional().nullable(),
  telegram: z.string().optional().nullable(),
  customLink1: z.string().optional().nullable(),
  customLink2: z.string().optional().nullable(),
  customLink3: z.string().optional().nullable(),
  genres: z.array(z.string()).optional().nullable(),
  brandId: z.string().optional()
})

export async function GET(req: Request) {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser?.emailAddresses?.[0]?.emailAddress) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userEmail = clerkUser.emailAddresses[0].emailAddress
    const { searchParams } = new URL(req.url)
    const queryEmail = searchParams.get("userEmail")
    const queryBrandId = searchParams.get("brandId")

    console.log("[BRANDS_API] Request:", {
      userEmail,
      queryEmail,
      queryBrandId
    })

    // First get the user's brands with access info
    const user = await db.user.findFirst({
      where: {
        email: queryEmail || userEmail
      },
      include: {
        brandAccess: true
      }
    })

    if (!user) {
      console.log("[BRANDS_API] User not found:", { userEmail, queryEmail })
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log("[BRANDS_API] User found:", {
      email: user.email,
      role: user.role,
      brandAccessCount: user.brandAccess.length
    })

    // For superAdmin, return all brands or specific brand
    if (user.role === "superAdmin") {
      if (queryBrandId) {
        const brand = await db.brand.findFirst({
          where: {
            OR: [
              { id: queryBrandId },
              { brandId: queryBrandId }
            ],
            deletedAt: null
          },
          include: {
            access: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    name: true
                  }
                }
              }
            },
            _count: {
              select: {
                products: true
              }
            }
          }
        })
        console.log("[BRANDS_API] SuperAdmin brand query result:", {
          queryBrandId,
          found: !!brand
        })
        return NextResponse.json({ brands: brand ? [brand] : [] })
      }

      const brands = await db.brand.findMany({
        where: {
          deletedAt: null
        },
        include: {
          access: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true
                }
              }
            }
          },
          _count: {
            select: {
              products: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
      return NextResponse.json({ brands })
    }

    // For regular users, fetch their accessible brands with full data
    const brands = await db.brand.findMany({
      where: {
        AND: [
          { deletedAt: null },
          queryBrandId ? {
            OR: [
              { id: queryBrandId },
              { brandId: queryBrandId }
            ]
          } : {},
          {
            access: {
              some: {
                userId: user.id
              }
            }
          }
        ]
      },
      include: {
        access: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true
              }
            }
          }
        },
        _count: {
          select: {
            products: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc' as const
      }
    })

    console.log("[BRANDS_API] Regular user brands:", {
      queryBrandId,
      foundCount: brands.length,
      brandIds: brands.map(b => ({
        id: b.id,
        brandId: b.brandId,
        name: b.name
      }))
    })

    return NextResponse.json({ brands })
  } catch (error) {
    console.error("[BRANDS_API] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser?.emailAddresses?.[0]?.emailAddress) {
      return new NextResponse("User email not found", { status: 404 })
    }

    const userEmail = clerkUser.emailAddresses[0].emailAddress

    // Get user from database with retry
    let dbUser = null
    let retryCount = 0
    while (!dbUser && retryCount < 3) {
      dbUser = await db.user.findUnique({
        where: { email: userEmail },
        select: {
          id: true,
          email: true,
          name: true,
          role: true
        }
      })
      if (!dbUser) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        retryCount++
      }
    }

    if (!dbUser) {
      return new NextResponse("User not found", { status: 404 })
    }

    const json = await req.json()
    const body = createBrandSchema.parse(json)

    // Generate brandId from name if not provided
    const brandId = body.brandId || body.name.toLowerCase().replace(/[^a-zA-Z0-9]/g, '')

    // Create brand and brandAccess in a transaction to ensure consistency
    const result = await db.$transaction(async (tx) => {
      // First create the brand
      const brand = await tx.brand.create({
        data: {
          name: body.name,
          brandId: brandId,
          description: body.description || null,
          tagline: body.tagline || null,
          imageUrl: body.imageUrl || null,
          colors: body.colors || [],
          website: body.website || null,
          facebook: body.facebook || null,
          twitter: body.twitter || null,
          telegram: body.telegram || null,
          customLink1: body.customLink1 || null,
          customLink2: body.customLink2 || null,
          customLink3: body.customLink3 || null,
          isApproved: false,
          isHidden: true,
          lastModifiedByEmail: dbUser.email,
          lastModifiedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          genres: body.genres ? {
            connect: body.genres.map(genreId => ({ id: genreId }))
          } : undefined
        }
      })

      console.log("[BRANDS_API] Created brand:", {
        id: brand.id,
        brandId: brand.brandId,
        name: brand.name
      })

      // Create brand access separately to ensure proper relationship
      const access = await tx.brandAccess.create({
        data: {
          userId: dbUser.id,
          brandId: brandId, // Use the brandId field that matches the schema relation
          role: "owner"
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        }
      })

      console.log("[BRANDS_API] Created brand access:", {
        userId: dbUser.id,
        brandId: brandId,
        role: "owner"
      })

      // Create activity log
      await tx.userActivity.create({
        data: {
          userEmail: dbUser.email,
          type: "BRAND_CREATE",
          details: JSON.stringify({
            brandId: brand.brandId,
            brandName: brand.name
          })
        }
      })

      return {
        ...brand,
        access: [access]
      }
    })

    return NextResponse.json({
      success: true,
      brand: {
        ...result,
        isApproved: false,
        isHidden: true
      }
    })
  } catch (error) {
    console.error("[BRANDS]", error)
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify({
        error: "Validation failed",
        details: error.errors
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    return new NextResponse(JSON.stringify({
      error: "Failed to create brand",
      details: error instanceof Error ? error.message : "Unknown error"
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

export async function PATCH(req: Request) {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser?.emailAddresses?.[0]?.emailAddress) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userEmail = clerkUser.emailAddresses[0].emailAddress

    // Get user from database
    const user = await db.user.findFirst({
      where: {
        email: userEmail
      }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if user is platform moderator or superAdmin
    if (!["platformModerator", "superAdmin"].includes(user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await req.json()
    const { brandId, approve } = body

    if (!brandId) {
      return NextResponse.json({ error: "Brand ID required" }, { status: 400 })
    }

    // Update brand approval and hidden status
    const updatedBrand = await db.brand.update({
      where: { id: brandId },
      data: {
        isApproved: approve,
        isHidden: !approve,
        lastModifiedByEmail: user.email,
        lastModifiedAt: new Date()
      }
    })

    return NextResponse.json({ success: true, brand: updatedBrand })
  } catch (error) {
    console.error("[BRANDS_PATCH]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 