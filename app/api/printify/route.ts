import { NextRequest, NextResponse } from "next/server";
import * as printifyApi from "@/lib/api/printify";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    
    if (!action) {
      return NextResponse.json(
        { error: "Missing action parameter" },
        { status: 400 }
      );
    }
    
    let result;
    
    switch (action) {
      case "print-providers":
        result = await printifyApi.getPrintProviders();
        break;
        
      case "shops":
        result = await printifyApi.getShops();
        break;
        
      case "provider-products":
        const providerId = searchParams.get("providerId");
        if (!providerId) {
          return NextResponse.json(
            { error: "Missing providerId parameter" },
            { status: 400 }
          );
        }
        result = await printifyApi.getPrintProviderProducts(Number(providerId));
        break;
        
      case "product-variants":
        const variantProviderId = searchParams.get("providerId");
        const productId = searchParams.get("productId");
        if (!variantProviderId || !productId) {
          return NextResponse.json(
            { error: "Missing providerId or productId parameter" },
            { status: 400 }
          );
        }
        result = await printifyApi.getProductVariants(
          Number(variantProviderId),
          productId
        );
        break;
        
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Printify API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, shopId, ...data } = await request.json();
    
    if (!action) {
      return NextResponse.json(
        { error: "Missing action parameter" },
        { status: 400 }
      );
    }
    
    if (!shopId && action !== "calculate-shipping") {
      return NextResponse.json(
        { error: "Missing shopId parameter" },
        { status: 400 }
      );
    }
    
    let result;
    
    switch (action) {
      case "create-product":
        result = await printifyApi.createShopProduct(shopId, data.product);
        break;
        
      case "update-product":
        if (!data.productId) {
          return NextResponse.json(
            { error: "Missing productId parameter" },
            { status: 400 }
          );
        }
        result = await printifyApi.updateShopProduct(
          shopId,
          data.productId,
          data.productData
        );
        break;
        
      case "delete-product":
        if (!data.productId) {
          return NextResponse.json(
            { error: "Missing productId parameter" },
            { status: 400 }
          );
        }
        result = await printifyApi.deleteShopProduct(shopId, data.productId);
        break;
        
      case "publish-product":
        if (!data.productId || !data.publishData) {
          return NextResponse.json(
            { error: "Missing productId or publishData parameter" },
            { status: 400 }
          );
        }
        result = await printifyApi.publishProduct(
          shopId,
          data.productId,
          data.publishData
        );
        break;
        
      case "create-order":
        result = await printifyApi.createShopOrder(shopId, data.orderData);
        break;
        
      case "calculate-shipping":
        if (!data.shopId || !data.shippingData) {
          return NextResponse.json(
            { error: "Missing shopId or shippingData parameter" },
            { status: 400 }
          );
        }
        result = await printifyApi.calculateShipping(
          data.shopId,
          data.shippingData
        );
        break;
        
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Printify API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 