import { NextRequest, NextResponse } from "next/server";
import * as openaiApi from "@/lib/api/openai";

export async function POST(request: NextRequest) {
  try {
    const { action, ...data } = await request.json();
    
    if (!action) {
      return NextResponse.json(
        { error: "Missing action parameter" },
        { status: 400 }
      );
    }
    
    let result;
    
    switch (action) {
      case "generate-text":
        if (!data.prompt) {
          return NextResponse.json(
            { error: "Missing prompt parameter" },
            { status: 400 }
          );
        }
        result = await openaiApi.generateText(data.prompt, data.options);
        break;
        
      case "generate-product-description":
        if (!data.productName || !data.productType) {
          return NextResponse.json(
            { error: "Missing required parameters" },
            { status: 400 }
          );
        }
        result = await openaiApi.generateProductDescription(
          data.productName,
          data.productType,
          data.targetAudience || "general consumers",
          data.keyFeatures || []
        );
        break;
        
      case "generate-product-tags":
        if (!data.productName || !data.productType || !data.description) {
          return NextResponse.json(
            { error: "Missing required parameters" },
            { status: 400 }
          );
        }
        result = await openaiApi.generateProductTags(
          data.productName,
          data.productType,
          data.description
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
    console.error("OpenAI API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 