import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { BonClient } from "./bon-client.types";
import { fetchBonsClients } from "./bon-client.api";

export function useBonsClients(page: number, search: string) {
  const [bonsClients, setBonsClients] = useState<BonClient[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const list = await fetchBonsClients(page, search);
      setBonsClients(list.items);
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

  return { bonsClients, total, totalPages, loading, error, setError, reload };
}
