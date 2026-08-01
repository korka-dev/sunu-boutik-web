import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { Category } from "./categories.types";
import { fetchAllCategories, fetchCategories } from "./categories.api";

export function useCategories(page: number, search: string) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const list = await fetchCategories(page, search);
      setCategories(list.items);
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

  return { categories, total, totalPages, loading, error, setError, reload };
}

export function useAllCategories() {
  const [allCategories, setAllCategories] = useState<Category[]>([]);

  const reload = useCallback(() => {
    fetchAllCategories()
      .then(setAllCategories)
      .catch(() => {});
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { allCategories, reload };
}
