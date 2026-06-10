export type MediaType = "IMAGE" | "VIDEO";

export interface ProductMedia {
  id: string;
  media_type: MediaType;
  file: string;
  file_url: string; // The full path to the image, including /media/
  sort_order: number;
}

export interface ProductVariant {
  id: string;
  sku: string;
  size: string;
  color: string;
  price: string;
  is_active: boolean;
  available_quantity: number;
  stock_quantity: number;        // alias exposed by backend serializer
  is_unlimited_stock: boolean;   // if true, always allow purchase
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
  is_active?: boolean;
  parent?: string | null;
  parent_id?: string | null;
  children?: Category[];
}

export interface ProductSummary {
  id: string;
  name: string;
  slug: string;
  base_price: string;
  image?: string;
  main_image?: string;
  badge?: string;
  category?: string;         // raw UUID from backend
  category_detail?: Category; // nested category object from backend
  description?: string;
  is_visible?: boolean;
  material?: string;
  sleeve?: string;
  length?: string;
  neck_line?: string;
  fit?: string;
  variants?: ProductVariant[];
  media?: ProductMedia[];
}

export interface FeaturedCollection {
  id: string;
  title: string;
  subtitle: string;
  products: ProductSummary[];
  banner_image?: string;
}

export type Product = ProductSummary;
