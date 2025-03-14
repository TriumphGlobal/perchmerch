import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { nanoid } from "nanoid";

interface OrderItem {
  productId: string;
  brandId: string;
  quantity: number;
}

interface ShippingAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface OrderRequest {
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  isGift?: boolean;
  giftMessage?: string;
}

// Helper function to validate shipping address
function validateShippingAddress(address: ShippingAddress): boolean {
  const requiredFields = [
    "firstName",
    "lastName",
    "email",
    "phone",
    "address1",
    "city",
    "state",
    "zip",
    "country"
  ];

  for (const field of requiredFields) {
    if (!address[field as keyof ShippingAddress]) {
      return false;
    }
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(address.email)) {
    return false;
  }

  // Basic phone validation (allow various formats)
  const phoneRegex = /^[\d\s\-+()]{10,}$/;
  if (!phoneRegex.test(address.phone)) {
    return false;
  }

  // Basic ZIP code validation (allow various formats)
  const zipRegex = /^[\d\s-]{5,}$/;
  if (!zipRegex.test(address.zip)) {
    return false;
  }

  return true;
}

export async function POST(request: Request) {
  const headersList = headers();
  console.log(`[Order Creation] Referer: ${headersList.get("referer")}`);

  try {
    const body: OrderRequest = await request.json();
    const { items, shippingAddress, isGift, giftMessage } = body;

    // Validate request body
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "No items provided" },
        { status: 400 }
      );
    }

    // Validate shipping address
    if (!validateShippingAddress(shippingAddress)) {
      return NextResponse.json(
        { error: "Invalid shipping address" },
        { status: 400 }
      );
    }

    // Fetch all products and validate they exist
    const products = await Promise.all(
      items.map(async (item: OrderItem) => {
        const product = await db.product.findUnique({
          where: {
            id: item.productId,
            brandId: item.brandId
          },
          include: {
            brand: true
          }
        });

        if (!product) {
          throw new Error(`Product ${item.productId} not found`);
        }

        return {
          ...product,
          quantity: item.quantity
        };
      })
    );

    // Generate order ID
    const orderId = nanoid();

    // Create Printify order payload
    const printifyOrder = {
      external_id: orderId,
      shipping_method: 1, // Standard shipping
      shipping_address: {
        first_name: shippingAddress.firstName,
        last_name: shippingAddress.lastName,
        email: shippingAddress.email,
        phone: shippingAddress.phone,
        address1: shippingAddress.address1,
        address2: shippingAddress.address2,
        city: shippingAddress.city,
        state_code: shippingAddress.state,
        country_code: shippingAddress.country,
        zip: shippingAddress.zip,
      },
      is_gift: isGift || false,
      gift_message: giftMessage,
      line_items: await Promise.all(
        products.map(async (product) => {
          return {
            product_id: product.printifyId,
            variant_id: product.variants[0].id, // Use first variant for now
            quantity: product.quantity
          };
        })
      )
    };

    // Send order to Printify
    const printifyResponse = await fetch("https://api.printify.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.PRINTIFY_API_KEY}`
      },
      body: JSON.stringify(printifyOrder)
    });

    if (!printifyResponse.ok) {
      console.error("[Printify Error]", await printifyResponse.text());
      throw new Error("Failed to create Printify order");
    }

    const printifyData = await printifyResponse.json();

    // Calculate total amount
    const totalAmount = products.reduce(
      (sum, product) => sum + (product.price * product.quantity),
      0
    );

    // Calculate brand earnings (50% of total)
    const brandEarnings = totalAmount * 0.5;

    // Create order in database
    const order = await db.order.create({
      data: {
        id: orderId,
        printifyOrderId: printifyData.id,
        status: "pending",
        shippingAddress,
        isGift: isGift || false,
        giftMessage,
        totalAmount,
        brandEarnings,
        brandId: products[0].brandId,
        affiliateDue: 0,
        userId: null
      }
    });

    // Log success
    console.log(`[Order Creation] Success - Order ID: ${order.id}`);

    return NextResponse.json({
      orderId: order.id,
      printifyOrderId: order.printifyOrderId
    });
  } catch (error) {
    console.error("[Order Creation] Error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
} 