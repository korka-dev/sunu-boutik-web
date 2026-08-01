export interface Client {
  id: number;
  name: string;
  phone?: string | null;
  address?: string | null;
  created_at: string;
}

export interface ClientList {
  items: Client[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
