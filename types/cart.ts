import type { ProductVariant } from "@/types/product";

export type CartStatus = "ACTIVE" | "CHECKED_OUT" | "EXPIRED" | "MERGED" | "ABANDONED";

export interface CartItem {
  id: string;
  variant: ProductVariant;
  /** Flat product name string (from the updated API response) */
  product_name: string;
  /** Thumbnail URL for the cart item image */
  thumbnail: string;
  /** Defensive fields to support product page linking if API provides them */
  product_slug?: string;
  product_id?: string;
  quantity: number;
  subtotal: string;
}

export interface Cart {
  id: string;
  status: CartStatus;
  /** True when this cart belongs to an anonymous guest session */
  is_guest: boolean;
  items: CartItem[];
  total_quantity: number;
  total_price: string;
}
