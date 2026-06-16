import type { ProductSummary } from "./product";

export type SectionType = "REELS" | "FEATURED" | "BANNER_GRID" | "CATEGORIES" | "BANNER" | "FEATURED_PRODUCTS" | "DISCOVERY_FEED";

export interface MediaContent {
  id: string;
  title: string;
  slug: string;
  video: string;
  external_url?: string;
  media_type: "UPLOAD" | "EXTERNAL";
  thumbnail: string;
  caption?: string;
  linked_products: ProductSummary[];
  category_detail?: any;
  published_at: string;
  metadata?: any;
  base_price?: string | number;
  variants?: any[];
}

export interface DiscoveryFeedItem {
  id: string;
  content: MediaContent;
  sort_order: number;
  is_visible: boolean;
}

export interface DiscoveryFeed {
  is_active: any;
  surface: string;
  id: string;
  name: string;
  slug: string;
  description?: string;
  items: DiscoveryFeedItem[];
}

export interface Announcement {
  id: string;
  title: string;
  cta_text?: string;
  redirect_url?: string;
  is_visible: boolean;
  sort_order: number;
  linked_product?: any;       // full product object returned by storefront serializer
  linked_product_id?: string; // write-only FK used when creating/updating
  linked_promotion?: any;
  linked_promotion_id?: string;
}

export interface Promotion {
  id: string;
  title: string;
  description?: string;
  image?: string;
  images?: any[];
  category?: string; // Target Category ID
  brand?: string;    // Target Brand ID
  cta_text?: string;
  cta_link?: string;
  is_visible: boolean;
  is_active?: boolean;
  products: any[];
  product_ids?: string[];
  slug: string;
  promotion_type: "BANNER" | "CAMPAIGN" | "EXCLUSIVE" | "SYSTEM";
  sort_order: number;
}

export interface NavigationMenu {
  id: string;
  name: string;
  slug: string;
}

export interface NavigationItem {
  id: string;
  label: string;
  href?: string;
  category_slug?: string;
  is_featured: boolean;
  sort_order: number;
  children?: NavigationItem[];
  parent?: string | null;      // parent NavigationItem id
  menu?: string;               // NavigationMenu id
  linked_category_id?: string;
  linked_url?: string;
  is_active: boolean;
}

export interface HomepageSection {
  id: string;
  section_type: SectionType;
  title?: string;
  sort_order: number;
  data: any;
}

export interface HomepageLayout {
  sections: HomepageSection[];
}
