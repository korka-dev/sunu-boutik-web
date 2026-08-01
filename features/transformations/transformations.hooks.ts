import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { Product } from "@/features/products/products.types";
import { fetchTransformableProducts, fetchTransformationHistory } from "./transformations.api";
import { TransformationLog } from "./transformations.types";

export function useTransformableProducts() {
  const [products, setProducts] = useState<Product[]>([]);

  const reload = useCallback(() => {
    fetchTransformableProducts()
      .then(setProducts)
      .catch(() => {});
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { products, reload };
}

const PAGE_SIZE = 20;

export function useTransformationHistory(page: number) {
  const [history, setHistory] = useState<TransformationLog[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const list = await fetchTransformationHistory(page, PAGE_SIZE);
      setHistory(list.items);
      setTotal(list.total);
      setTotalPages(list.total_pages);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur de chargement de l'historique");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { history, total, totalPages, loading, error, reload };
}
