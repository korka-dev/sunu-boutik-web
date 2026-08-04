import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { Note } from "./notes.types";
import { fetchNotes } from "./notes.api";

export function useNotes(page: number, search: string) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const list = await fetchNotes(page, search);
      setNotes(list.items);
      setTotal(list.total);
      setTotalPages(list.total_pages);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { notes, total, totalPages, loading, error, setError, reload };
}
