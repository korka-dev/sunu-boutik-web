export interface BonClient {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface BonClientList {
  items: BonClient[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
