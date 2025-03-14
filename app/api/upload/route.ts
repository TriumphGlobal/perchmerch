import { NextRequest, NextResponse } from "next/server";
import * as s3Api from "@/lib/api/s3";
import { auth } from "@clerk/nextjs";
import { put } from "@vercel/blob";
import { nanoid } from "nanoid";

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const form = await req.formData();
    const file = form.get("file") as File;
    
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Invalid file type" },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large" },
        { status: 400 }
      );
    }

    // Generate a unique filename
    const ext = file.name.split(".").pop();
    const filename = `${nanoid()}.${ext}`;

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
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