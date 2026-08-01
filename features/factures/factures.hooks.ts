import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { fetchInvoices } from "./factures.api";
import { Invoice } from "./factures.types";

export function useInvoices(page: number, pageSize: number, search: string, date: string, statusFilter: string) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const list = await fetchInvoices(page, pageSize, search, date, statusFilter);
      setInvoices(list.items);
      setTotal(list.total);
      setTotalPages(list.total_pages);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, date, statusFilter]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { invoices, total, totalPages, loading, error, reload };
}
