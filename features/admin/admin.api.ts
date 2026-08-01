import { adminApi, api, setAdminToken } from "@/lib/api";
import { Overview, ShopList, ShopStats } from "./admin.types";

export async function loginAdmin(email: string, password: string) {
  const res = await api.post<{ access_token: string }>("/auth/login", { email, password });
  setAdminToken(res.access_token);
}

export function fetchOverview() {
  return adminApi.get<Overview>("/admin/overview");
}

export function fetchShops(page: number, pageSize: number, statusFilter?: string) {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (statusFilter) params.set("status_filter", statusFilter);
  return adminApi.get<ShopList>(`/admin/shops?${params.toString()}`);
}

export function fetchShopStats(shopId: number) {
  return adminApi.get<ShopStats>(`/admin/shops/${shopId}/stats`);
}

export function approveShop(shopId: number) {
  return adminApi.post(`/admin/shops/${shopId}/approve`);
}

export function rejectShop(shopId: number, reason: string | null) {
  return adminApi.post(`/admin/shops/${shopId}/reject`, { reason });
}
