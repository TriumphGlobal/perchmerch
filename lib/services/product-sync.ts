import { PrintifyAPI, PrintifyProduct } from "@/lib/api/printify";
import { ShopifyAPI, ShopifyProduct } from "@/lib/api/shopify";
import { processImageForProduct } from "@/lib/utils";

export class ProductSyncService {
  private printifyApi: PrintifyAPI;
  private shopifyApi: ShopifyAPI;

  constructor(printifyApi: PrintifyAPI, shopifyApi: ShopifyAPI) {
    this.printifyApi = printifyApi;
    this.shopifyApi = shopifyApi;
  }

  async syncProductToShopify(printifyProductId: string, customizations: {
    title?: string;
    description?: string;
    price?: number;
    images?: string[];
  } = {}) {
    try {
      // 1. Get product from Printify
      const printifyProduct = await this.printifyApi.getProduct(printifyProductId);

      // 2. Transform Printify product to Shopify format
      const shopifyProductData = {
        title: customizations.title || printifyProduct.title,
        body_html: customizations.description || printifyProduct.description,
        vendor: "PerchMerch",
        product_type: "Print on Demand",
        variants: printifyProduct.variants.map(variant => ({
          price: customizations.price?.toString() || variant.price.toString(),
          sku: variant.sku,
          inventory_quantity: 999 // Print on demand, so we can set this high
        })),
        images: (customizations.images || printifyProduct.images).map(image => ({
          src: processImageForProduct(image)
        }))
      };

      // 3. Create product in Shopify
      const shopifyProduct = await this.shopifyApi.createProduct(shopifyProductData);

      // 4. Store the mapping between Printify and Shopify IDs
      // This would typically be stored in your database
      const productMapping = {
        printifyId: printifyProduct.id,
        shopifyId: shopifyProduct.id,
        variants: printifyProduct.variants.map((variant, index) => ({
          printifyVariantId: variant.id,
          shopifyVariantId: shopifyProduct.variants[index].id
        }))
      };

      return {
        printifyProduct,
        shopifyProduct,
        productMapping
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to sync product to Shopify: ${error.message}`);
      }
      throw new Error('Failed to sync product to Shopify');
    }
  }

  async updateSyncedProduct(printifyProductId: string, shopifyProductId: string, updates: {
    title?: string;
    description?: string;
    price?: number;
    images?: string[];
  }) {
    try {
      // 1. Update Printify product if needed
      // Note: Printify might have different update requirements

      // 2. Update Shopify product
      const shopifyUpdates: any = {};
      if (updates.title) shopifyUpdates.title = updates.title;
      if (updates.description) shopifyUpdates.body_html = updates.description;
      if (updates.images) {
        shopifyUpdates.images = updates.images.map(image => ({
          src: processImageForProduct(image)
        }));
      }
      if (updates.price) {
        const product = await this.shopifyApi.getProduct(shopifyProductId);
        shopifyUpdates.variants = product.variants.map(variant => ({
          id: variant.id,
          price: updates.price?.toString()
        }));
      }

      const updatedShopifyProduct = await this.shopifyApi.updateProduct(
        shopifyProductId,
        shopifyUpdates
      );

      return {
        shopifyProduct: updatedShopifyProduct
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to update synced product: ${error.message}`);
      }
      throw new Error('Failed to update synced product');
    }
  }

  async deleteSyncedProduct(printifyProductId: string, shopifyProductId: string) {
    try {
      // Delete from both platforms
      await Promise.all([
        this.shopifyApi.deleteProduct(shopifyProductId),
        // Add Printify delete method if available
      ]);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to delete synced product: ${error.message}`);
      }
      throw new Error('Failed to delete synced product');
    }
  }
}

// Create a singleton instance
export const productSyncService = new ProductSyncService(
  new PrintifyAPI(process.env.NEXT_PUBLIC_PRINTIFY_API_KEY || ''),
  new ShopifyAPI(process.env.NEXT_PUBLIC_SHOPIFY_ACCESS_TOKEN || '')
); 