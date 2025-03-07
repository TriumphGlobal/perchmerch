import axios, { AxiosError } from 'axios';

const PRINTIFY_API_BASE = 'https://api.printify.com/v1';

export interface PrintifyProduct {
  id: string;
  title: string;
  description: string;
  images: string[];
  variants: Array<{
    id: string;
    title: string;
    price: number;
    sku: string;
  }>;
  print_provider_id: string;
  print_areas: Array<{
    position: string;
    height: number;
    width: number;
  }>;
  blueprint_id: string;
}

export class PrintifyAPI {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private get headers() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  async getProduct(productId: string): Promise<PrintifyProduct> {
    try {
      const response = await axios.get(
        `${PRINTIFY_API_BASE}/catalog/blueprints/${productId}`,
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(`Failed to fetch Printify product: ${error.message}`);
      }
      throw new Error('Failed to fetch Printify product');
    }
  }

  async createProduct(shopId: string, productData: any) {
    try {
      const response = await axios.post(
        `${PRINTIFY_API_BASE}/shops/${shopId}/products`,
        productData,
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(`Failed to create Printify product: ${error.message}`);
      }
      throw new Error('Failed to create Printify product');
    }
  }

  async publishToShopify(shopId: string, productId: string) {
    try {
      const response = await axios.post(
        `${PRINTIFY_API_BASE}/shops/${shopId}/products/${productId}/publish`,
        { platform: 'shopify' },
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(`Failed to publish to Shopify: ${error.message}`);
      }
      throw new Error('Failed to publish to Shopify');
    }
  }

  async uploadImage(imageFile: File): Promise<string> {
    try {
      // First, get upload URL
      const uploadUrlResponse = await axios.post(
        `${PRINTIFY_API_BASE}/uploads/images`,
        { file_name: imageFile.name },
        { headers: this.headers }
      );

      // Upload the image to the provided URL
      const formData = new FormData();
      formData.append('file', imageFile);
      await axios.put(uploadUrlResponse.data.upload_url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return uploadUrlResponse.data.image_url;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(`Failed to upload image: ${error.message}`);
      }
      throw new Error('Failed to upload image');
    }
  }
}

export const printifyApi = new PrintifyAPI(process.env.NEXT_PUBLIC_PRINTIFY_API_KEY || '');

/**
 * Get all print providers
 */
export async function getPrintProviders() {
  return printifyApi.getProduct("print-providers");
}

/**
 * Get all products from a print provider
 */
export async function getPrintProviderProducts(printProviderId: number) {
  return printifyApi.getProduct(`print-providers/${printProviderId}/products`);
}

/**
 * Get all available print provider variants for a product
 */
export async function getProductVariants(printProviderId: number, productId: string) {
  return printifyApi.getProduct(`print-providers/${printProviderId}/products/${productId}/variants`);
}

/**
 * Get all shops
 */
export async function getShops() {
  return printifyApi.getProduct("shops");
}

/**
 * Create a new product in a shop
 */
export async function createShopProduct(shopId: string, product: {
  title: string;
  description: string;
  blueprint_id: number;
  print_provider_id: number;
  variants: Array<{
    id: number;
    price: number;
    is_enabled?: boolean;
  }>;
  print_areas: Record<string, {
    src: string;
    position?: {
      area_width?: number;
      area_height?: number;
      width?: number;
      height?: number;
      top?: number;
      left?: number;
    };
  }>;
}) {
  return printifyApi.createProduct(shopId, product);
}

/**
 * Get a product from a shop
 */
export async function getShopProduct(shopId: string, productId: string) {
  return printifyApi.getProduct(`shops/${shopId}/products/${productId}`);
}

/**
 * Update a product in a shop
 */
export async function updateShopProduct(
  shopId: string,
  productId: string,
  productData: Partial<{
    title: string;
    description: string;
    variants: Array<{
      id: number;
      price: number;
      is_enabled?: boolean;
    }>;
    print_areas: Record<string, {
      src: string;
      position?: {
        area_width?: number;
        area_height?: number;
        width?: number;
        height?: number;
        top?: number;
        left?: number;
      };
    }>;
  }>
) {
  return printifyApi.createProduct(shopId, productData);
}

/**
 * Delete a product from a shop
 */
export async function deleteShopProduct(shopId: string, productId: string) {
  return printifyApi.getProduct(`shops/${shopId}/products/${productId}`);
}

/**
 * Publish a product to a sales channel
 */
export async function publishProduct(
  shopId: string,
  productId: string,
  publishData: {
    external_id?: string;
    sales_channel: "shopify" | "etsy" | "ebay" | "woocommerce";
    title?: string;
    description?: string;
    handle?: string;
    tags?: string[];
    options?: Array<{
      name: string;
      values: string[];
    }>;
  }
) {
  return printifyApi.publishToShopify(shopId, productId);
}

/**
 * Get all orders for a shop
 */
export async function getShopOrders(shopId: string) {
  return printifyApi.getProduct(`shops/${shopId}/orders`);
}

/**
 * Create a new order in a shop
 */
export async function createShopOrder(
  shopId: string,
  orderData: {
    external_id: string;
    line_items: Array<{
      product_id: string;
      variant_id: number;
      quantity: number;
    }>;
    shipping_method: number;
    shipping_address: {
      first_name: string;
      last_name: string;
      email?: string;
      phone?: string;
      country: string;
      region?: string;
      address1: string;
      address2?: string;
      city: string;
      zip: string;
    };
    send_shipping_notification?: boolean;
  }
) {
  return printifyApi.createProduct(shopId, orderData);
}

/**
 * Calculate shipping rates for an order
 */
export async function calculateShipping(
  shopId: string,
  shippingData: {
    address: {
      country: string;
      region?: string;
      zip: string;
    };
    items: Array<{
      product_id: string;
      variant_id: number;
      quantity: number;
    }>;
  }
) {
  return printifyApi.createProduct(shopId, {
    address: shippingData.address,
    items: shippingData.items
  });
} 