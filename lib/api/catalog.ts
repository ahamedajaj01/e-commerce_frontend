import { apiClient } from "@/lib/api/client";
import type { Product, Category, Brand } from "@/types/product";

export async function fetchProducts(params?: Record<string, string>): Promise<Product[]> {
  const query = params ? `?${new URLSearchParams(params).toString()}` : "";
  const data = await apiClient<any>(`/storefront/products/${query}`);
  // Handle both paginated { results: [...] } and flat array responses
  return data?.results || (Array.isArray(data) ? data : []);
}

export async function fetchProductDetail(slugOrId: string): Promise<Product> {
  // The backend now natively supports fetching by slug at /products/{slug}/
  // This is the most efficient and SEO-friendly way to fetch.
  try {
    return await apiClient<Product>(`/storefront/products/${slugOrId}/`);
  } catch (error) {
    // If slug lookup fails, we check the list as a safety fallback
    // (useful for older hard-coded links using UUIDs)
    const products = await fetchProducts();
    const found = products.find(p => p.id === slugOrId || p.slug === slugOrId);
    if (found) return found;
    throw error;
  }
}

export async function fetchCategories(): Promise<Category[]> {
  const data = await apiClient<any>("/storefront/categories/");
  return data?.results || (Array.isArray(data) ? data : []);
}

export async function fetchBackofficeProducts(
  token?: string,
  params: Record<string, any> = {}
): Promise<{ results: Product[], count: number }> {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append("page", params.page.toString());
  if (params.page_size) queryParams.append("page_size", params.page_size.toString());
  if (params.search) queryParams.append("search", params.search);
  if (params.category) queryParams.append("category", params.category);
  if (params.brand) queryParams.append("brand", params.brand);
  if (params.stock_status) queryParams.append("stock_status", params.stock_status);
  if (params.min_price) queryParams.append("min_price", params.min_price.toString());
  if (params.max_price) queryParams.append("max_price", params.max_price.toString());

  const data = await apiClient<any>(`/backoffice/products/?${queryParams.toString()}`, { token });
  return {
    results: data?.results || data?.data || (Array.isArray(data) ? data : []),
    count: data?.meta?.total_items || data?.total_count || data?.count || data?.total || (Array.isArray(data) ? data.length : 0)
  };
}

export async function fetchBackofficeProductIds(
  token?: string,
  params: Record<string, any> = {}
): Promise<string[]> {
  const queryParams = new URLSearchParams(params);
  return apiClient<string[]>(`/backoffice/products/ids?${queryParams.toString()}`, { token });
}


export async function fetchBackofficeBrands(token?: string): Promise<Brand[]> {
  return apiClient<Brand[]>(`/backoffice/brands/`, { token });
}

export async function createBrand(payload: FormData, token: string): Promise<Brand> {
  return apiClient<Brand>(`/backoffice/brands/`, {
    method: "POST",
    body: payload,
    token,
  });
}

export async function deleteBrand(id: string, token: string): Promise<void> {
  return apiClient<void>(`/backoffice/brands/${id}/`, {
    method: "DELETE",
    token,
  });
}

export async function fetchBackofficeCategories(token?: string): Promise<Category[]> {
  return apiClient<Category[]>("/backoffice/categories/", { token });
}

export async function createCategory(
  data: { name: string; parent_id?: string | null },
  token?: string
): Promise<Category> {
  return apiClient<Category>("/backoffice/categories/", {
    method: "POST",
    body: data,
    token,
  });
}

export async function updateCategory(
  id: string,
  data: { name?: string; parent_id?: string | null; is_active?: boolean },
  token?: string
): Promise<Category> {
  return apiClient<Category>(`/backoffice/categories/${id}/`, {
    method: "PATCH",
    body: data,
    token,
  });
}

export async function deleteCategory(
  id: string,
  token?: string
): Promise<{ success: boolean; message: string }> {
  return apiClient<{ success: boolean; message: string }>(`/backoffice/categories/${id}/`, {
    method: "DELETE",
    token,
  });
}

export async function createProduct(data: FormData, token?: string): Promise<Product> {
  return apiClient<Product>("/backoffice/products/", {
    method: "POST",
    body: data,
    token,
  });
}

export async function updateProduct(id: string, data: FormData | Record<string, any>, token?: string): Promise<Product> {
  return apiClient<Product>(`/backoffice/products/${id}/`, {
    method: "PATCH",
    body: data as any,
    token,
  });
}

export async function deleteProduct(id: string, token?: string): Promise<{ success: boolean; message: string }> {
  return apiClient<{ success: boolean; message: string }>(`/backoffice/products/${id}/`, {
    method: "DELETE",
    token,
  });
}


// Storefront dynamic fetchers
export async function fetchProductCatalog(): Promise<Product[]> {
  return fetchProducts();
}

export async function fetchFeaturedProducts(): Promise<Product[]> {
  return fetchProducts({ is_featured: "true" });
}

export async function fetchFeaturedCollections(): Promise<any[]> {
  // Map categories to the shape expected by storefront landing page
  const categories = await fetchCategories();
  return categories.map(cat => ({
    label: cat.name,
    image: cat.image || "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop"
  }));
}
