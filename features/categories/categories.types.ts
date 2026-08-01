export interface Category {
  id: number;
  name: string;
  created_at: string;
}

export interface CategoryList {
  items: Category[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
