export interface CaisseSummary {
  date: string;
  invoices_count: number;
  total_invoiced: number;
  total_collected: number;
  remaining: number;
}

export interface CaisseEntry {
  id: number;
  invoice_id: number;
  invoice_number: string;
  client_name: string;
  amount: number;
  created_at: string;
}

export interface CaisseJournal {
  items: CaisseEntry[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
