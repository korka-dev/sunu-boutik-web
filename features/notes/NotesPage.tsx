"use client";

import { FormEvent, useState } from "react";
import Modal from "@/components/Modal";
import SearchBar from "@/components/SearchBar";
import { ApiError } from "@/lib/api";
import { Note } from "./notes.types";
import { createNote, deleteNote, updateNote } from "./notes.api";
import { useNotes } from "./notes.hooks";
import NoteCard from "./NoteCard";

export default function NotesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { notes, total, totalPages, loading, error, setError, reload } = useNotes(page, search);

  const [showFormModal, setShowFormModal] = useState(false);
  const [viewingNote, setViewingNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  function onSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function openCreate() {
    setEditingId(null);
    setTitle("");
    setContent("");
    setFormError("");
    setShowFormModal(true);
  }

  function openEdit(note: Note) {
    setViewingNote(null);
    setEditingId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setFormError("");
    setShowFormModal(true);
  }

  function closeFormModal() {
    setShowFormModal(false);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    if (!trimmedTitle) {
      setFormError("Le titre de la note est requis");
      return;
    }
    if (!trimmedContent) {
      setFormError("Le contenu de la note est requis");
      return;
    }
    setSubmitting(true);
    try {
      if (editingId) {
        await updateNote(editingId, trimmedTitle, trimmedContent);
      } else {
        await createNote(trimmedTitle, trimmedContent);
        setPage(1);
      }
      closeFormModal();
      await reload();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Erreur lors de l'enregistrement");
    } finally {
      setSubmitting(false);
    }
  }

  async function onDelete(id: number) {
    if (!confirm("Supprimer cette note ?")) return;
    try {
      await deleteNote(id);
      setViewingNote(null);
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur lors de la suppression");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900">Notes</h1>
        <button
          onClick={openCreate}
          className="bg-blue-600 text-white rounded-md px-3 sm:px-4 py-2 text-sm font-medium hover:bg-blue-700"
        >
          + Nouvelle note
        </button>
      </div>

      <SearchBar value={search} onChange={onSearchChange} placeholder="Rechercher une note (titre, contenu, date)..." />

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow p-4 space-y-3">
              <div className="h-4 rounded bg-gray-200 animate-pulse w-2/3" style={{ opacity: 1 - i * 0.1 }} />
              <div className="h-3 rounded bg-gray-200 animate-pulse w-full" style={{ opacity: 1 - i * 0.1 }} />
              <div className="h-3 rounded bg-gray-200 animate-pulse w-4/5" style={{ opacity: 1 - i * 0.1 }} />
            </div>
          ))}
        </div>
      )}

      {!loading && notes.length === 0 && (
        <p className="text-center text-gray-400 py-10">Aucune note</p>
      )}

      {!loading && notes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} onOpen={setViewingNote} onEdit={openEdit} onDelete={onDelete} />
          ))}
        </div>
      )}

      {!loading && total > 0 && (
        <div className="flex items-center justify-between px-1 text-sm text-gray-500">
          <span>
            {total} note{total > 1 ? "s" : ""} — page {page} / {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-md border border-gray-300 disabled:opacity-40 hover:bg-gray-50 bg-white"
            >
              Précédent
            </button>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-md border border-gray-300 disabled:opacity-40 hover:bg-gray-50 bg-white"
            >
              Suivant
            </button>
          </div>
        </div>
      )}

      {viewingNote && (
        <Modal title={viewingNote.title} onClose={() => setViewingNote(null)}>
          <div className="space-y-4">
            <p className="text-xs text-gray-400">
              Créée le {new Date(viewingNote.created_at).toLocaleString("fr-FR")}
              {viewingNote.updated_at !== viewingNote.created_at &&
                ` · modifiée le ${new Date(viewingNote.updated_at).toLocaleString("fr-FR")}`}
            </p>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{viewingNote.content}</p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => openEdit(viewingNote)}
                className="flex-1 bg-blue-600 text-white rounded-md py-2 font-medium hover:bg-blue-700"
              >
                Modifier
              </button>
              <button
                onClick={() => onDelete(viewingNote.id)}
                className="flex-1 bg-red-50 text-red-600 rounded-md py-2 font-medium hover:bg-red-100"
              >
                Supprimer
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showFormModal && (
        <Modal title={editingId ? "Modifier la note" : "Nouvelle note"} onClose={closeFormModal}>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Titre</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Titre de la note"
                autoFocus
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Contenu</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Écrivez votre note ici..."
                rows={6}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {formError && <p className="text-sm text-red-600">{formError}</p>}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-blue-600 text-white rounded-md py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? "Enregistrement..." : editingId ? "Modifier" : "Ajouter"}
              </button>
              <button type="button" onClick={closeFormModal} className="px-4 py-2 text-gray-500 hover:text-gray-800">
                Annuler
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
