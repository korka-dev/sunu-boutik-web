import { api, fetchAllPages } from "@/lib/api";
import { Client, ClientList } from "./clients.types";

const PAGE_SIZE = 10;

export function fetchClients(page: number, search: string) {
  const params = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE) });
  if (search) params.set("search", search);
  return api.get<ClientList>(`/clients?${params.toString()}`);
}

export function fetchAllClients() {
  return fetchAllPages<Client>("/clients", api.get<ClientList>);
}

export function fetchClient(id: number) {
  return api.get<Client>(`/clients/${id}`);
}

export function createClient(payload: { name: string; phone: string | null; address: string | null }) {
  return api.post<Client>("/clients", payload);
}

export function updateClient(id: number, payload: { name: string; phone: string | null; address: string | null }) {
  return api.patch<Client>(`/clients/${id}`, payload);
}

export function deleteClient(id: number) {
  return api.delete(`/clients/${id}`);
}
