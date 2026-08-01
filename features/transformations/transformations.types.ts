import { Product } from "@/features/products/products.types";

export type TransformationDirection = "to_secondaire" | "to_principale";

export interface TransformationLog {
  id: number;
  product_id: number;
  product_name: string;
  direction: TransformationDirection;
  unit_from: string;
  unit_to: string;
  quantity_from: number;
  quantity_to: number;
  note?: string | null;
  created_by_id?: number | null;
  created_by_name?: string | null;
  created_at: string;
}

export interface TransformationResult {
  log: TransformationLog;
  product: Product;
}

export interface TransformationLogList {
  items: TransformationLog[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
