import axios, { AxiosError } from 'axios';

const SHOPIFY_API_VERSION = '2024-01';
const SHOPIFY_API_BASE = `https://${process.env.NEXT_PUBLIC_SHOPIFY_SHOP_NAME}.myshopify.com/admin/api/${SHOPIFY_API_VERSION}`;

export interface ShopifyProduct {
  id: string;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  handle: string;
  variants: Array<{
    id: string;
    title: string;
    price: string;
    sku: string;
    inventory_quantity: number;
  }>;
  images: Array<{
    id: string;
    src: string;
    position: number;
  }>;
}

export class ShopifyAPI {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private get headers() {
    return {
      'X-Shopify-Access-Token': this.accessToken,
      'Content-Type': 'application/json'
    };
  }

  async createProduct(productData: {
    title: string;
    body_html: string;
    vendor: string;
    product_type: string;
    variants: Array<{
      price: string;
      sku: string;
      inventory_quantity: number;
    }>;
    images: Array<{
      src: string;
    }>;
  }): Promise<ShopifyProduct> {
    try {
      const response = await axios.post(
        `${SHOPIFY_API_BASE}/products.json`,
        { product: productData },
        { headers: this.headers }
      );
      return response.data.product;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(`Failed to create Shopify product: ${error.message}`);
      }
      throw new Error('Failed to create Shopify product');
    }
  }

  async updateProduct(productId: string, productData: Partial<{
    title: string;
    body_html: string;
    vendor: string;
    product_type: string;
    variants: Array<{
      id?: string;
      price: string;
      sku: string;
      inventory_quantity: number;
    }>;
    images: Array<{
      id?: string;
      src: string;
    }>;
  }>): Promise<ShopifyProduct> {
    try {
      const response = await axios.put(
        `${SHOPIFY_API_BASE}/products/${productId}.json`,
        { product: productData },
        { headers: this.headers }
      );
      return response.data.product;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(`Failed to update Shopify product: ${error.message}`);
      }
      throw new Error('Failed to update Shopify product');
    }
  }

  async deleteProduct(productId: string): Promise<void> {
    try {
      await axios.delete(
        `${SHOPIFY_API_BASE}/products/${productId}.json`,
        { headers: this.headers }
      );
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(`Failed to delete Shopify product: ${error.message}`);
      }
      throw new Error('Failed to delete Shopify product');
    }
  }

  async getProduct(productId: string): Promise<ShopifyProduct> {
    try {
      const response = await axios.get(
        `${SHOPIFY_API_BASE}/products/${productId}.json`,
        { headers: this.headers }
      );
      return response.data.product;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(`Failed to fetch Shopify product: ${error.message}`);
      }
      throw new Error('Failed to fetch Shopify product');
    }
  }

  async createOrder(orderData: {
    line_items: Array<{
      variant_id: string;
      quantity: number;
    }>;
    customer: {
      email: string;
      first_name: string;
      last_name: string;
    };
    shipping_address: {
      first_name: string;
      last_name: string;
      address1: string;
      address2?: string;
      city: string;
      province?: string;
      country: string;
      zip: string;
      phone?: string;
    };
  }) {
    try {
      const response = await axios.post(
        `${SHOPIFY_API_BASE}/orders.json`,
        { order: orderData },
        { headers: this.headers }
      );
      return response.data.order;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(`Failed to create Shopify order: ${error.message}`);
      }
      throw new Error('Failed to create Shopify order');
    }
  }

  async getOrder(orderId: string) {
    try {
      const response = await axios.get(
        `${SHOPIFY_API_BASE}/orders/${orderId}.json`,
        { headers: this.headers }
      );
      return response.data.order;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(`Failed to fetch Shopify order: ${error.message}`);
      }
      throw new Error('Failed to fetch Shopify order');
    }
  }

  async calculateShippingRates(orderData: {
    line_items: Array<{
      variant_id: string;
      quantity: number;
    }>;
    shipping_address: {
      address1: string;
      address2?: string;
      city: string;
      province?: string;
      country: string;
      zip: string;
    };
  }) {
    try {
      const response = await axios.post(
        `${SHOPIFY_API_BASE}/shipping_rates/calculate.json`,
        { rate: orderData },
        { headers: this.headers }
      );
      return response.data.shipping_rates;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(`Failed to calculate shipping rates: ${error.message}`);
      }
      throw new Error('Failed to calculate shipping rates');
    }
  }
}

export const shopifyApi = new ShopifyAPI(process.env.NEXT_PUBLIC_SHOPIFY_ACCESS_TOKEN || ''); 