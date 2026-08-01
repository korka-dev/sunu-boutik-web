import { api, fetchAllPages } from "@/lib/api";
import { Product, ProductList, ProductStats } from "./products.types";

const PAGE_SIZE = 10;

export function fetchProducts(page: number, search: string) {
  const params = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE) });
  if (search) params.set("search", search);
  return api.get<ProductList>(`/products?${params.toString()}`);
}

export function fetchAllProducts() {
  return fetchAllPages<Product>("/products", api.get<ProductList>);
}

export function fetchProductStats() {
  return api.get<ProductStats>("/products/stats");
}

export function createProduct(payload: Record<string, unknown>) {
  return api.post<Product>("/products", payload);
}

export function updateProduct(id: number, payload: Record<string, unknown>) {
  return api.patch<Product>(`/products/${id}`, payload);
}

export function deleteProduct(id: number) {
  return api.delete(`/products/${id}`);
}
