import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value)
}

/**
 * Processes an image URL to ensure it's properly sized for brand display
 * @param imageUrl The original image URL
 * @returns A processed image URL with sizing parameters
 */
export function processImageForBrand(imageUrl: string): string {
  // If no image URL is provided, return a default placeholder
  if (!imageUrl) return "https://placehold.co/400x400.jpg";
  
  // If it's already a placeholder, ensure consistent dimensions
  if (imageUrl.includes('placehold.co')) {
    return imageUrl.replace(/placehold\.co\/\d+x\d+/, 'placehold.co/400x400');
  }
  
  // Handle object URLs (for local file uploads)
  if (imageUrl.startsWith('blob:')) {
    // We can't modify blob URLs, but they should be displayed properly with CSS
    return imageUrl;
  }
  
  // For Unsplash images
  if (imageUrl.includes('unsplash.com')) {
    // Add sizing parameters with improved cropping for consistent square images
    return `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}w=400&h=400&fit=crop&crop=faces,center&q=80`;
  }
  
  // For Cloudinary images
  if (imageUrl.includes('cloudinary.com')) {
    // Add transformation parameters for consistent square crop
    return imageUrl.replace(/\/upload\//, '/upload/c_fill,w_400,h_400,g_auto,q_auto,f_auto/');
  }
  
  // For general images, we can't resize them on the fly without a backend service
  // In a real app, you would upload to a service like Cloudinary or have a backend resize endpoint
  return imageUrl;
}

/**
 * Processes an image URL to ensure it's properly sized for product display
 * @param imageUrl The original image URL
 * @returns A processed image URL with sizing parameters
 */
export function processImageForProduct(imageUrl: string): string {
  // If no image URL is provided, return a default placeholder
  if (!imageUrl) return "https://placehold.co/600x800.jpg";
  
  // If it's already a placeholder, ensure consistent dimensions
  if (imageUrl.includes('placehold.co')) {
    return imageUrl.replace(/placehold\.co\/\d+x\d+/, 'placehold.co/600x800');
  }
  
  // Handle object URLs (for local file uploads)
  if (imageUrl.startsWith('blob:')) {
    // We can't modify blob URLs, but they should be displayed properly with CSS
    return imageUrl;
  }
  
  // For Unsplash images
  if (imageUrl.includes('unsplash.com')) {
    // Add sizing parameters with improved cropping
    return `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}w=600&h=800&fit=crop&crop=entropy&q=80`;
  }
  
  // For Cloudinary images
  if (imageUrl.includes('cloudinary.com')) {
    // Add transformation parameters
    return imageUrl.replace(/\/upload\//, '/upload/c_fill,w_600,h_800,q_auto,f_auto/');
  }
  
  // For general images, we can't resize them on the fly without a backend service
  return imageUrl;
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

export function generateUniqueCode(userId: string): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 6)
  const userPart = userId.substring(0, 4)
  return `${userPart}${timestamp}${randomPart}`.toUpperCase()
}

