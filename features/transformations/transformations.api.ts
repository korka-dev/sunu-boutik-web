import { api, fetchAllPages } from "@/lib/api";
import { Product, ProductList } from "@/features/products/products.types";
import { TransformationDirection, TransformationLogList, TransformationResult } from "./transformations.types";

export function fetchTransformableProducts() {
  return fetchAllPages<Product>("/products?transformable_only=true", api.get<ProductList>);
}

export function fetchTransformationHistory(page: number, pageSize: number) {
  return api.get<TransformationLogList>(`/transformations/history?page=${page}&page_size=${pageSize}`);
}

export function executeTransformation(payload: {
  product_id: number;
  direction: TransformationDirection;
  quantity: number;
  note: string | null;
}) {
  return api.post<TransformationResult>("/transformations/execute", payload);
}
