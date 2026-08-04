export interface Note {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface NoteList {
  items: Note[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
