import { env } from "@/env.mjs";
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Initialize S3 client
const s3Client = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Generate a unique key for an S3 object
 */
export function generateS3Key(prefix: string, fileName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 10);
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  
  return `${prefix}/${timestamp}-${randomString}-${sanitizedFileName}`;
}

/**
 * Upload a file to S3
 */
export async function uploadToS3(
  file: File | Blob,
  key: string,
  contentType?: string
): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const command = new PutObjectCommand({
      Bucket: env.AWS_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType || file.type,
      ACL: "public-read",
    });
    
    await s3Client.send(command);
    
    // Return the public URL of the uploaded file
    return `https://${env.AWS_BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
  } catch (error) {
    console.error("Error uploading to S3:", error);
    throw error;
  }
}

/**
 * Upload a base64 image to S3
 */
export async function uploadBase64ImageToS3(
  base64Image: string,
  key: string
): Promise<string> {
  try {
    // Extract content type and base64 data
    const matches = base64Image.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    
    if (!matches || matches.length !== 3) {
      throw new Error("Invalid base64 image format");
    }
    
    const contentType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, "base64");
    
    const command = new PutObjectCommand({
      Bucket: env.AWS_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: "public-read",
    });
    
    await s3Client.send(command);
    
    // Return the public URL of the uploaded file
    return `https://${env.AWS_BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
  } catch (error) {
    console.error("Error uploading base64 image to S3:", error);
    throw error;
  }
}

/**
 * Delete a file from S3
 */
export async function deleteFromS3(key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: env.AWS_BUCKET_NAME,
      Key: key,
    });
    
    await s3Client.send(command);
  } catch (error) {
    console.error("Error deleting from S3:", error);
    throw error;
  }
}

/**
 * Generate a presigned URL for uploading a file directly to S3
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 3600
): Promise<string> {
  try {
    const command = new PutObjectCommand({
      Bucket: env.AWS_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
      ACL: "public-read",
    });
    
    return await getSignedUrl(s3Client, command, { expiresIn });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    throw error;
  }
}

/**
 * Generate a presigned URL for downloading a file from S3
 */
export async function getPresignedDownloadUrl(
  key: string,
  expiresIn = 3600
): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: env.AWS_BUCKET_NAME,
      Key: key,
    });
    
    return await getSignedUrl(s3Client, command, { expiresIn });
  } catch (error) {
    console.error("Error generating presigned download URL:", error);
    throw error;
  }
}

/**
 * Extract the key from an S3 URL
 */
export function getKeyFromS3Url(url: string): string | null {
  try {
    const s3Url = new URL(url);
    const bucketName = s3Url.hostname.split(".")[0];
    
    if (bucketName === env.AWS_BUCKET_NAME) {
      return s3Url.pathname.substring(1); // Remove leading slash
    }
    
    return null;
  } catch (error) {
    console.error("Error extracting key from S3 URL:", error);
    return null;
  }
} 