import { api } from "@/lib/api";
import { Note, NoteList } from "./notes.types";

const PAGE_SIZE = 12;

export function fetchNotes(page: number, search: string) {
  const params = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE) });
  if (search) params.set("search", search);
  return api.get<NoteList>(`/notes?${params.toString()}`);
}

export function createNote(title: string, content: string) {
  return api.post<Note>("/notes", { title, content });
}

export function updateNote(id: number, title: string, content: string) {
  return api.patch<Note>(`/notes/${id}`, { title, content });
}

export function deleteNote(id: number) {
  return api.delete(`/notes/${id}`);
}
