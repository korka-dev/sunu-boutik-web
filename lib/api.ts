const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function setToken(token: string) {
  localStorage.setItem("token", token);
}

export function clearToken() {
  localStorage.removeItem("token");
}

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("admin_token");
}

export function setAdminToken(token: string) {
  localStorage.setItem("admin_token", token);
}

export function clearAdminToken() {
  localStorage.removeItem("admin_token");
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// Cache mémoire court-terme pour les GET : rend les navigations répétées instantanées
// sans servir de données obsolètes après une création/modification/suppression.
const GET_CACHE_TTL_MS = 15_000;
const getCache = new Map<string, { data: unknown; expiresAt: number }>();
const inFlight = new Map<string, Promise<unknown>>();

function cacheKey(path: string, tokenGetter: () => string | null): string {
  return `${tokenGetter === getAdminToken ? "admin" : "shop"}:${path}`;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  tokenGetter: () => string | null = getToken
): Promise<T> {
  const method = (options.method || "GET").toUpperCase();
  const key = cacheKey(path, tokenGetter);

  if (method === "GET") {
    const cached = getCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data as T;
    }
    const pending = inFlight.get(key);
    if (pending) {
      return pending as Promise<T>;
    }
  } else {
    // Toute mutation invalide le cache pour rester cohérent avec les données fraîches.
    getCache.clear();
  }

  const token = tokenGetter();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const doFetch = async (): Promise<T> => {
    const res = await fetch(`${API_URL}${path}`, { ...options, headers });

    if (!res.ok) {
      let detail = "Une erreur est survenue";
      try {
        const data = await res.json();
        detail = data.detail || detail;
      } catch {
        // ignore
      }
      throw new ApiError(detail, res.status);
    }

    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  };

  if (method !== "GET") {
    return doFetch();
  }

  const promise = doFetch()
    .then((data) => {
      getCache.set(key, { data, expiresAt: Date.now() + GET_CACHE_TTL_MS });
      return data;
    })
    .finally(() => {
      inFlight.delete(key);
    });

  inFlight.set(key, promise);
  return promise;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  postForm: <T>(path: string, formData: FormData) =>
    request<T>(path, { method: "POST", body: formData }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

export const adminApi = {
  get: <T>(path: string) => request<T>(path, {}, getAdminToken),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }, getAdminToken),
};

export function pdfUrl(invoiceId: number): string {
  return `${API_URL}/invoices/${invoiceId}/pdf`;
}

export async function fetchPdfBlob(invoiceId: number): Promise<Blob> {
  const token = getToken();
  const res = await fetch(`${API_URL}/invoices/${invoiceId}/pdf`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new ApiError("Impossible de générer le PDF", res.status);
  return res.blob();
}

export interface Shop {
  id: number;
  name: string;
  address?: string | null;
  phone?: string | null;
}

export interface User {
  id: number;
  full_name: string;
  email: string;
  role: string;
  shop_id: number;
  must_change_password: boolean;
}

export interface Category {
  id: number;
  name: string;
  created_at: string;
}

export interface CategoryList {
  items: Category[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface Product {
  id: number;
  name: string;
  category_id: number;
  category_name: string;
  reference?: string | null;
  unit_price: number;
  quantity: number;
  unit: string;
  pack_size: number;
  created_at: string;
}

export interface ProductStats {
  total_products: number;
  total_stock_quantity: number;
  total_stock_value: number;
  out_of_stock_count: number;
  average_price: number;
}

export interface Client {
  id: number;
  name: string;
  phone?: string | null;
  address?: string | null;
  created_at: string;
}

export interface ClientList {
  items: Client[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface InvoiceLine {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface Invoice {
  id: number;
  number: string;
  client_id?: number | null;
  total: number;
  note?: string | null;
  created_at: string;
  lines: InvoiceLine[];
}

export interface ShopAdmin {
  id: number;
  name: string;
  address?: string | null;
  phone?: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  reviewed_at?: string | null;
  owner_email?: string | null;
  owner_name?: string | null;
}

export interface ProductList {
  items: Product[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ShopList {
  items: ShopAdmin[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ShopStats {
  shop_id: number;
  shop_name: string;
  status: string;
  products_count: number;
  clients_count: number;
  invoices_count: number;
  total_revenue: number;
  users_count: number;
}

export interface Overview {
  total_shops: number;
  pending_shops: number;
  approved_shops: number;
  rejected_shops: number;
  total_invoices: number;
  total_revenue: number;
}
