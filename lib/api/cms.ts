import { apiClient } from "@/lib/api/client";
import type { HomepageLayout, Announcement, NavigationItem, DiscoveryFeed, MediaContent, HomepageSection, Promotion } from "@/types/cms";

// ── Storefront Endpoints ────────────────────────────────────────────────────
export async function fetchAnnouncements(): Promise<Announcement[]> {
  return apiClient<Announcement[]>("/storefront/announcements/");
}

export async function fetchNavigation(): Promise<NavigationItem[]> {
  try {
    const data = await apiClient<any[]>("/storefront/navigation/");
    // The API returns an array of Menus. We take the items from the first one.
    if (Array.isArray(data) && data.length > 0) {
      return data[0].items || [];
    }
    return [];
  } catch (err) {
    console.warn("[CMS] Navigation fetch failed, falling back to empty list", err);
    return [];
  }
}

export async function fetchHomepageLayout(): Promise<any> {
  return apiClient<any>("/storefront/homepage/");
}

export async function fetchDiscoveryFeeds(): Promise<DiscoveryFeed[]> {
  return apiClient<DiscoveryFeed[]>("/storefront/discovery/feeds/");
}

export async function fetchDiscoveryFeedBySlug(slug: string): Promise<DiscoveryFeed> {
  return apiClient<DiscoveryFeed>(`/storefront/discovery/${slug}/`);
}

export async function fetchStorefrontPromotions(type?: string): Promise<Promotion[]> {
  try {
    let url = "/storefront/promotions/?page_size=100";
    if (type) {
      url += `&type=${type}`;
    }
    const data = await apiClient<any>(url);
    return Array.isArray(data) ? data : data?.results || [];
  } catch (err: any) {
    console.warn(`[CMS] Storefront promotions fetch failed (${err.status || 'unknown'}): ${err.message}. Falling back to empty list.`);
    return [];
  }
}

export async function fetchStorefrontPromotion(idOrSlug: string): Promise<Promotion> {
  return apiClient<Promotion>(`/storefront/promotions/${idOrSlug}/`);
}

export async function resolveSocialMedia(url: string): Promise<{ resolved_url: string; needs_proxy: boolean }> {
  return apiClient<{ resolved_url: string; needs_proxy: boolean }>(`/storefront/cms/resolve-social/?url=${encodeURIComponent(url)}`);
}

// ── Backoffice: Media Content ───────────────────────────────────────────────
export async function fetchBackofficeMediaContent(token?: string): Promise<MediaContent[] | { results: MediaContent[] }> {
  return apiClient<any>("/backoffice/cms/media/", { token });
}

export async function createBackofficeMedia(payload: FormData, token?: string): Promise<any> {
  return apiClient<any>("/backoffice/cms/media/", { method: "POST", body: payload, token });
}

export async function updateBackofficeMedia(mediaId: string, payload: any, token?: string): Promise<any> {
  return apiClient<any>(`/backoffice/cms/media/${mediaId}/`, { method: "PUT", body: payload, token });
}

export async function deleteBackofficeMedia(mediaId: string, token?: string): Promise<any> {
  return apiClient<any>(`/backoffice/cms/media/${mediaId}/`, { method: "DELETE", token });
}

// ── Backoffice: Discovery Feeds ─────────────────────────────────────────────
export async function fetchBackofficeFeeds(token?: string): Promise<DiscoveryFeed[]> {
  const data = await apiClient<any>("/backoffice/cms/feeds/", { token });
  return Array.isArray(data) ? data : data?.results || [];
}

export async function createBackofficeFeed(data: { name: string; description?: string }, token?: string): Promise<DiscoveryFeed> {
  return apiClient<DiscoveryFeed>("/backoffice/cms/feeds/", { method: "POST", body: data, token });
}

export async function addMediaToFeed(feedId: string, mediaId: string, sortOrder: number, token?: string): Promise<any> {
  return apiClient<any>("/backoffice/cms/feeds/items/", {
    method: "POST",
    body: { feed_id: feedId, content_id: mediaId, sort_order: sortOrder },
    token,
  });
}

export async function deleteDiscoveryFeedItem(itemId: string, token?: string): Promise<any> {
  return apiClient<any>(`/backoffice/cms/feeds/items/${itemId}/`, { method: "DELETE", token });
}

// Promotional Campaigns
export async function fetchBackofficePromotions(token?: string, type?: string): Promise<Promotion[]> {
  const url = type ? `/backoffice/cms/promotions/?type=${type}` : "/backoffice/cms/promotions/";
  const data = await apiClient<any>(url, { token });
  return Array.isArray(data) ? data : data?.results || [];
}

export async function createPromotion(data: FormData | Partial<Promotion> | Record<string, any>, token?: string): Promise<Promotion> {
  return apiClient<Promotion>("/backoffice/cms/promotions/", {
    method: "POST",
    body: data as any,
    token,
  });
}

export async function updatePromotion(id: string, data: FormData | Partial<Promotion> | Record<string, any>, token?: string): Promise<Promotion> {
  return apiClient<Promotion>(`/backoffice/cms/promotions/${id}/`, {
    method: "PATCH",
    body: data as any,
    token,
  });
}

export async function deletePromotion(id: string, token?: string): Promise<any> {
  return apiClient<any>(`/backoffice/cms/promotions/${id}/`, {
    method: "DELETE",
    token,
  });
}

// ── Backoffice: Announcements ───────────────────────────────────────────────
export async function fetchBackofficeAnnouncements(token?: string): Promise<Announcement[]> {
  const data = await apiClient<any>("/backoffice/cms/announcements/", { token });
  return Array.isArray(data) ? data : data?.results || [];
}

export async function createAnnouncement(
  payload: {
    title: string;
    cta_text?: string;
    redirect_url?: string;
    linked_product_id?: string;
    linked_promotion_id?: string;
    is_visible: boolean;
    sort_order?: number;
  },
  token?: string
): Promise<Announcement> {
  return apiClient<Announcement>("/backoffice/cms/announcements/", { method: "POST", body: payload, token });
}

export async function updateAnnouncement(id: string, payload: Partial<Announcement & { linked_product_id?: string; linked_promotion_id?: string }>, token?: string): Promise<Announcement> {
  return apiClient<Announcement>(`/backoffice/cms/announcements/${id}/`, { method: "PUT", body: payload, token });
}

export async function deleteAnnouncement(id: string, token?: string): Promise<any> {
  return apiClient<any>(`/backoffice/cms/announcements/${id}/`, { method: "DELETE", token });
}

// ── Backoffice: Navigation ──────────────────────────────────────────────────
export async function fetchBackofficeNavigation(token?: string): Promise<any[]> {
  const data = await apiClient<any>("/backoffice/cms/navigation/", { token });
  return Array.isArray(data) ? data : data?.results || [];
}

export async function createNavigationMenu(payload: { name: string; slug: string }, token?: string): Promise<any> {
  return apiClient<any>("/backoffice/cms/navigation/", { method: "POST", body: payload, token });
}

export async function updateNavigationMenu(id: string, payload: { name?: string; slug?: string; is_active?: boolean }, token?: string): Promise<any> {
  return apiClient<any>(`/backoffice/cms/navigation/${id}/`, { method: "PATCH", body: payload, token });
}


export async function fetchBackofficeNavigationItems(token?: string): Promise<NavigationItem[]> {
  const data = await apiClient<any>("/backoffice/cms/navigation-items/", { token });
  return Array.isArray(data) ? data : data?.results || [];
}

export async function createNavigationItem(
  payload: {
    label: string;
    parent?: string | null;
    linked_category_id?: string | null;
    linked_url?: string;
    is_featured?: boolean;
    is_active?: boolean;
    sort_order?: number;
    menu?: string;
  },
  token?: string
): Promise<NavigationItem> {
  return apiClient<NavigationItem>("/backoffice/cms/navigation-items/", { method: "POST", body: payload, token });
}

export async function updateNavigationItem(id: string, payload: Partial<NavigationItem & { parent?: string | null; linked_category_id?: string | null; menu?: string }>, token?: string): Promise<NavigationItem> {
  return apiClient<NavigationItem>(`/backoffice/cms/navigation-items/${id}/`, { method: "PUT", body: payload, token });
}

export async function deleteNavigationItem(id: string, token?: string): Promise<any> {
  return apiClient<any>(`/backoffice/cms/navigation-items/${id}/`, { method: "DELETE", token });
}

export async function deleteNavigation(id: string, token?: string): Promise<any> {
  return apiClient<any>(`/backoffice/cms/navigation/${id}/`, { method: "DELETE", token });
}

export async function deleteDiscoveryFeed(id: string, token?: string): Promise<any> {
  return apiClient<any>(`/backoffice/cms/feeds/${id}/`, { method: "DELETE", token });
}

// ── Backoffice: Homepage Sections ───────────────────────────────────────────
export async function fetchBackofficeHomepageSections(token?: string): Promise<HomepageSection[]> {
  const data = await apiClient<any>("/backoffice/cms/homepage-sections/", { token });
  return Array.isArray(data) ? data : data?.results || [];
}

export async function createHomepageSection(payload: Partial<HomepageSection>, token?: string): Promise<HomepageSection> {
  return apiClient<HomepageSection>("/backoffice/cms/homepage-sections/", { method: "POST", body: payload, token });
}

export async function updateHomepageSection(id: string, payload: Partial<HomepageSection>, token?: string): Promise<HomepageSection> {
  return apiClient<HomepageSection>(`/backoffice/cms/homepage-sections/${id}/`, { method: "PUT", body: payload, token });
}

export async function deleteHomepageSection(id: string, token?: string): Promise<any> {
  return apiClient<any>(`/backoffice/cms/homepage-sections/${id}/`, { method: "DELETE", token });
}

export async function fetchBackofficeCollections(token?: string): Promise<any[]> {
  return apiClient<any[]>("/backoffice/cms/collections/", { token });
}
