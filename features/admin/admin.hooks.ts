import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { fetchOverview, fetchShopStats, fetchShops } from "./admin.api";
import { Overview, ShopAdmin, ShopStats } from "./admin.types";

export function useAdminDashboard() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [recent, setRecent] = useState<ShopAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [ov, list] = await Promise.all([fetchOverview(), fetchShops(1, 5)]);
        setOverview(ov);
        setRecent(list.items);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return { overview, recent, loading, error };
}

export function useAdminShops(page: number, pageSize: number, statusFilter?: string) {
  const [shops, setShops] = useState<ShopAdmin[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const list = await fetchShops(page, pageSize, statusFilter);
      setShops(list.items);
      setTotal(list.total);
      setTotalPages(list.total_pages);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { shops, total, totalPages, loading, error, reload };
}

export function useShopStats() {
  const [stats, setStats] = useState<ShopStats | null>(null);
  const [loading, setLoading] = useState(false);

  function load(shopId: number) {
    setStats(null);
    setLoading(true);
    fetchShopStats(shopId)
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  return { stats, loading, load };
}
