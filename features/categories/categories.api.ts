import { api, fetchAllPages } from "@/lib/api";
import { Category, CategoryList } from "./categories.types";

const PAGE_SIZE = 10;

export function fetchCategories(page: number, search: string) {
  const params = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE) });
  if (search) params.set("search", search);
  return api.get<CategoryList>(`/categories?${params.toString()}`);
}

export function fetchAllCategories() {
  return fetchAllPages<Category>("/categories", api.get<CategoryList>);
}

export function createCategory(name: string) {
  return api.post<Category>("/categories", { name });
}

export function updateCategory(id: number, name: string) {
  return api.patch<Category>(`/categories/${id}`, { name });
}

export function deleteCategory(id: number) {
  return api.delete(`/categories/${id}`);
}
