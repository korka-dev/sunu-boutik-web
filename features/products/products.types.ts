export interface Product {
  id: number;
  name: string;
  category_id: number;
  category_name: string;
  reference?: string | null;
  unit_price: number;
  quantity: number;
  unit: string;
  pack_size: number;
  is_transformable: boolean;
  unit_secondaire?: string | null;
  conversion_ratio?: number | null;
  unit_price_secondaire?: number | null;
  quantity_secondaire: number;
  created_at: string;
}

export interface ProductList {
  items: Product[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ProductStats {
  total_products: number;
  total_stock_quantity: number;
  total_stock_value: number;
  out_of_stock_count: number;
  average_price: number;
}

export type ProductForm = "principale" | "secondaire";
