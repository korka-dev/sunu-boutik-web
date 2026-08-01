import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { fetchCaisseJournal, fetchCaisseSummary } from "./caisse.api";
import { CaisseEntry, CaisseSummary } from "./caisse.types";

export function useCaisseSummary(date: string) {
  const [summary, setSummary] = useState<CaisseSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchCaisseSummary(date);
      setSummary(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { summary, loading, error };
}

const PAGE_SIZE = 20;

export function useCaisseJournal(date: string, page: number) {
  const [entries, setEntries] = useState<CaisseEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchCaisseJournal(date, page, PAGE_SIZE);
      setEntries(data.items);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [date, page]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { entries, total, totalPages, loading, error };
}
