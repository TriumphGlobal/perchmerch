import { db } from "../lib/db"
import type { DBUser } from "../../types/localDbU"

export async function checkBrandOwnership(email: string, brandId: string): Promise<boolean> {
  try {
    const user = await db.user.findUnique({
      where: { email },
      include: {
        brands: true
      }
    })

    return user?.brands.some(brand => brand.id === brandId) || false
  } catch (error) {
    console.error("Error checking brand ownership:", error)
    return false
  }
} 