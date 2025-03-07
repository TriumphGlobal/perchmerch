import { prisma } from "@/lib/prisma"
import { productSyncService } from "./product-sync"
import { shopifyApi } from "@/lib/api/shopify"
import { Product, ProductVariant } from "@prisma/client"

export interface CreateOrderInput {
  userId: string;
  brandId: string;
  items: Array<{
    productId: string;
    variantId: string;
    quantity: number;
  }>;
  shippingAddress: {
    firstName: string;
    lastName: string;
    address1: string;
    address2?: string;
    city: string;
    state?: string;
    country: string;
    zipCode: string;
    phone?: string;
  };
}

export class OrderService {
  async createOrder(input: CreateOrderInput) {
    try {
      // 1. Calculate total and validate products
      const products = await prisma.product.findMany({
        where: {
          id: { in: input.items.map(item => item.productId) }
        },
        include: {
          variants: true
        }
      });

      let total = 0;
      const lineItems = [];

      for (const item of input.items) {
        const product = products.find((p: Product & { variants: ProductVariant[] }) => p.id === item.productId);
        if (!product) {
          throw new Error(`Product not found: ${item.productId}`);
        }

        const variant = product.variants.find((v: ProductVariant) => v.id === item.variantId);
        if (!variant) {
          throw new Error(`Variant not found: ${item.variantId}`);
        }

        total += variant.price * item.quantity;
        lineItems.push({
          variant_id: variant.shopifyId,
          quantity: item.quantity
        });
      }

      // 2. Calculate shipping
      const shippingRates = await shopifyApi.calculateShippingRates({
        line_items: lineItems,
        shipping_address: {
          address1: input.shippingAddress.address1,
          address2: input.shippingAddress.address2,
          city: input.shippingAddress.city,
          province: input.shippingAddress.state,
          country: input.shippingAddress.country,
          zip: input.shippingAddress.zipCode
        }
      });

      const shippingCost = shippingRates[0]?.price || 0;
      total += shippingCost;

      // 3. Create Shopify order
      const shopifyOrder = await shopifyApi.createOrder({
        line_items: lineItems,
        customer: {
          email: "customer@example.com", // Get from user profile
          first_name: input.shippingAddress.firstName,
          last_name: input.shippingAddress.lastName
        },
        shipping_address: {
          first_name: input.shippingAddress.firstName,
          last_name: input.shippingAddress.lastName,
          address1: input.shippingAddress.address1,
          address2: input.shippingAddress.address2,
          city: input.shippingAddress.city,
          province: input.shippingAddress.state,
          country: input.shippingAddress.country,
          zip: input.shippingAddress.zipCode,
          phone: input.shippingAddress.phone
        }
      });

      // 4. Create order in our database
      const order = await prisma.order.create({
        data: {
          orderNumber: `PM-${Date.now()}`,
          total,
          shippingCost,
          userId: input.userId,
          brandId: input.brandId,
          items: {
            create: input.items.map(item => {
              const product = products.find((p: Product & { variants: ProductVariant[] }) => p.id === item.productId);
              const variant = product?.variants.find((v: ProductVariant) => v.id === item.variantId);
              return {
                quantity: item.quantity,
                price: variant?.price || 0,
                productId: item.productId,
                variantId: item.variantId
              };
            })
          },
          shippingAddress: {
            create: {
              firstName: input.shippingAddress.firstName,
              lastName: input.shippingAddress.lastName,
              address1: input.shippingAddress.address1,
              address2: input.shippingAddress.address2,
              city: input.shippingAddress.city,
              state: input.shippingAddress.state,
              country: input.shippingAddress.country,
              zipCode: input.shippingAddress.zipCode,
              phone: input.shippingAddress.phone
            }
          }
        },
        include: {
          items: {
            include: {
              product: true,
              variant: true
            }
          },
          shippingAddress: true
        }
      });

      return {
        order,
        shopifyOrder
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to create order: ${error.message}`);
      }
      throw new Error('Failed to create order');
    }
  }

  async getOrder(orderId: string) {
    return prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
            variant: true
          }
        },
        shippingAddress: true
      }
    });
  }

  async getUserOrders(userId: string) {
    return prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
            variant: true
          }
        },
        shippingAddress: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async getBrandOrders(brandId: string) {
    return prisma.order.findMany({
      where: { brandId },
      include: {
        items: {
          include: {
            product: true,
            variant: true
          }
        },
        shippingAddress: true,
        user: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async updateOrderStatus(orderId: string, status: string) {
    return prisma.order.update({
      where: { id: orderId },
      data: { status }
    });
  }
}

export const orderService = new OrderService(); 