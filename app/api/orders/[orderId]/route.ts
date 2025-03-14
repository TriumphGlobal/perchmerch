import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  const headersList = headers();
  console.log(`[Order Details] Referer: ${headersList.get("referer")}`);

  const { orderId } = params;

  if (!orderId) {
    return NextResponse.json(
      { error: "Missing orderId" },
      { status: 400 }
    );
  }

  try {
    const order = await db.order.findUnique({
      where: {
        id: orderId
      },
      select: {
        id: true,
        shopifyId: true,
        totalAmount: true,
        brandEarnings: true,
        createdAt: true,
        brand: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...order,
      createdAt: order.createdAt.toISOString()
    });
  } catch (error) {
    console.error("[Order Details] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch order details" },
      { status: 500 }
    );
  }
} 