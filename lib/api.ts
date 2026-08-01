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

export interface PaginatedList<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// L'API plafonne toujours page_size à 100, quelle que soit la valeur demandée
// (voir sunu-boutik-api/app/routers/*.py). Toute liste susceptible de dépasser
// 100 éléments doit donc être parcourue page par page plutôt que récupérée en
// un seul appel avec un page_size arbitrairement grand.
const FETCH_ALL_PAGE_SIZE = 100;

export async function fetchAllPages<T>(
  path: string,
  getter: (path: string) => Promise<PaginatedList<T>>
): Promise<T[]> {
  const sep = path.includes("?") ? "&" : "?";
  const pageUrl = (page: number) => `${path}${sep}page=${page}&page_size=${FETCH_ALL_PAGE_SIZE}`;

  const first = await getter(pageUrl(1));
  const items = [...first.items];

  if (first.total_pages > 1) {
    const rest = await Promise.all(
      Array.from({ length: first.total_pages - 1 }, (_, i) => getter(pageUrl(i + 2)))
    );
    for (const page of rest) items.push(...page.items);
  }

  return items;
}

export interface Shop {
  id: number;
  name: string;
  address?: string | null;
  phone?: string | null;
  phone2?: string | null;
  phone3?: string | null;
  ninea?: string | null;
  rc?: string | null;
  status?: string;
}

export interface User {
  id: number;
  full_name: string;
  email: string;
  role: string;
  shop_id: number;
  must_change_password: boolean;
}

