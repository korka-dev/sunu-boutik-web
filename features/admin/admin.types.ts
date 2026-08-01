export interface ShopAdmin {
  id: number;
  name: string;
  address?: string | null;
  phone?: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  reviewed_at?: string | null;
  owner_email?: string | null;
  owner_name?: string | null;
}

export interface ShopList {
  items: ShopAdmin[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ShopStats {
  shop_id: number;
  shop_name: string;
  status: string;
  products_count: number;
  clients_count: number;
  invoices_count: number;
  total_revenue: number;
  users_count: number;
}

export interface Overview {
  total_shops: number;
  pending_shops: number;
  approved_shops: number;
  rejected_shops: number;
  total_invoices: number;
  total_revenue: number;
}
