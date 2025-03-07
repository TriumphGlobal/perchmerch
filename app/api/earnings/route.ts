import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { prisma } from "@/lib/prisma";
import { Brand, User, Order, Affiliate } from "@prisma/client";

interface ReferredUser extends Pick<User, 'id' | 'name'> {
  Order: Pick<Order, 'brandEarnings'>[];
}

interface AffiliateWithBrand extends Pick<Affiliate, 'commissionRate'> {
  brand: Pick<Brand, 'id' | 'name'>;
  Order: Pick<Order, 'brandEarnings'>[];
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userId = session.userId;

    // Get user's brands
    const brands = await prisma.brand.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        totalEarnings: true,
      },
    });

    // Get referral earnings
    const referredUsers = await prisma.user.findMany({
      where: { referrerId: userId },
      select: {
        id: true,
        name: true,
        Order: {
          select: {
            brandEarnings: true,
          },
        },
      },
    }) as ReferredUser[];

    // Get affiliate earnings
    const affiliateEarnings = await prisma.affiliate.findMany({
      where: { userId },
      select: {
        brand: {
          select: {
            id: true,
            name: true,
          },
        },
        commissionRate: true,
        Order: {
          select: {
            brandEarnings: true,
          },
        },
      },
    }) as AffiliateWithBrand[];

    // Calculate totals
    const totalBrandEarnings = brands.reduce((sum: number, brand: Pick<Brand, 'totalEarnings'>) => 
      sum + brand.totalEarnings, 0);
    
    const referralEarnings = referredUsers.map((user: ReferredUser) => ({
      userId: user.id,
      userName: user.name || "Unknown User",
      amount: user.Order.reduce((sum: number, order: Pick<Order, 'brandEarnings'>) => 
        sum + (order.brandEarnings * 0.05), 0),
      commission: 5,
    }));

    const affiliateBreakdown = affiliateEarnings.map((affiliate: AffiliateWithBrand) => ({
      brandId: affiliate.brand.id,
      brandName: affiliate.brand.name,
      amount: affiliate.Order.reduce((sum: number, order: Pick<Order, 'brandEarnings'>) => 
        sum + (order.brandEarnings * affiliate.commissionRate), 0),
      commission: affiliate.commissionRate * 100,
    }));

    const totalReferralEarnings = referralEarnings.reduce((sum: number, earning) => 
      sum + earning.amount, 0);
    const totalAffiliateEarnings = affiliateBreakdown.reduce((sum: number, earning) => 
      sum + earning.amount, 0);
    const totalEarnings = totalBrandEarnings + totalReferralEarnings + totalAffiliateEarnings;

    // For now, we'll consider all earnings as available for payout
    // In a real system, you'd track which earnings have been paid out
    const summary = {
      totalEarnings,
      availableForPayout: totalEarnings,
      pendingEarnings: 0,
      lastPayout: null, // TODO: Implement payout tracking
    };

    const breakdown = {
      brandEarnings: brands.map(brand => ({
        brandId: brand.id,
        brandName: brand.name,
        amount: brand.totalEarnings,
        share: 50,
      })),
      referralEarnings,
      affiliateEarnings: affiliateBreakdown,
    };

    return NextResponse.json({ summary, breakdown });
  } catch (error) {
    console.error("Error fetching earnings:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 