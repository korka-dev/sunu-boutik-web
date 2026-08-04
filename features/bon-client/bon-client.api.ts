import { api } from "@/lib/api";
import { BonClient, BonClientList } from "./bon-client.types";

const PAGE_SIZE = 12;

export function fetchBonsClients(page: number, search: string) {
  const params = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE) });
  if (search) params.set("search", search);
  return api.get<BonClientList>(`/bons-clients?${params.toString()}`);
}

export function createBonClient(title: string, content: string) {
  return api.post<BonClient>("/bons-clients", { title, content });
}

export function updateBonClient(id: number, title: string, content: string) {
  return api.patch<BonClient>(`/bons-clients/${id}`, { title, content });
}

export function deleteBonClient(id: number) {
  return api.delete(`/bons-clients/${id}`);
}
