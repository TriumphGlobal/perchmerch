import { NextRequest, NextResponse } from "next/server";
import * as s3Api from "@/lib/api/s3";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const prefix = formData.get("prefix") as string || "uploads";
    
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }
    
    // Generate a unique key for the file
    const key = s3Api.generateS3Key(prefix, file.name);
    
    // Upload the file to S3
    const url = await s3Api.uploadToS3(file, key);
    
    return NextResponse.json({ url, key });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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
      case "upload-base64":
        if (!data.base64Image || !data.fileName) {
          return NextResponse.json(
            { error: "Missing required parameters" },
            { status: 400 }
          );
        }
        
        const prefix = data.prefix || "uploads";
        const key = s3Api.generateS3Key(prefix, data.fileName);
        
        result = {
          url: await s3Api.uploadBase64ImageToS3(data.base64Image, key),
          key,
        };
        break;
        
      case "get-presigned-url":
        if (!data.fileName || !data.contentType) {
          return NextResponse.json(
            { error: "Missing required parameters" },
            { status: 400 }
          );
        }
        
        const uploadPrefix = data.prefix || "uploads";
        const uploadKey = s3Api.generateS3Key(uploadPrefix, data.fileName);
        
        result = {
          url: await s3Api.getPresignedUploadUrl(
            uploadKey,
            data.contentType,
            data.expiresIn
          ),
          key: uploadKey,
        };
        break;
        
      case "delete-file":
        if (!data.key) {
          return NextResponse.json(
            { error: "Missing key parameter" },
            { status: 400 }
          );
        }
        
        await s3Api.deleteFromS3(data.key);
        result = { success: true };
        break;
        
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Upload API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 