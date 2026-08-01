import { api } from "@/lib/api";
import { CaisseJournal, CaisseSummary } from "./caisse.types";

export function fetchCaisseSummary(date: string) {
  return api.get<CaisseSummary>(`/caisse/summary?date=${date}`);
}

export function fetchCaisseJournal(date: string, page: number, pageSize: number) {
  const params = new URLSearchParams({ date, page: String(page), page_size: String(pageSize) });
  return api.get<CaisseJournal>(`/caisse/journal?${params.toString()}`);
}
