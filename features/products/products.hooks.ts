import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { Product, ProductStats } from "./products.types";
import { fetchAllProducts, fetchProducts, fetchProductStats } from "./products.api";

export function useProducts(page: number, search: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const list = await fetchProducts(page, search);
      setProducts(list.items);
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

  return { products, total, totalPages, loading, error, setError, reload };
}

export function useAllProducts() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  const reload = useCallback(() => {
    fetchAllProducts()
      .then(setAllProducts)
      .catch(() => {});
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { allProducts, reload };
}

export function useProductStats() {
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    fetchProductStats()
      .then(setStats)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Erreur de chargement"))
      .finally(() => setLoading(false));
  }, []);

  return { stats, loading, error, load };
}
