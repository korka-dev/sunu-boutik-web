import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { Client } from "./clients.types";
import { fetchAllClients, fetchClients } from "./clients.api";

export function useClients(page: number, search: string) {
  const [clients, setClients] = useState<Client[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const list = await fetchClients(page, search);
      setClients(list.items);
      setTotal(list.total);
      setTotalPages(list.total_pages);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { clients, total, totalPages, loading, error, setError, reload };
}

export function useAllClients() {
  const [allClients, setAllClients] = useState<Client[]>([]);

  const reload = useCallback(async () => {
    try {
      const items = await fetchAllClients();
      setAllClients(items);
    } catch {
      // Les suggestions sont un confort, pas bloquant si ça échoue.
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { allClients, reload };
}
