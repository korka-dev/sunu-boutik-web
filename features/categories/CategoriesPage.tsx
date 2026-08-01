"use client";

import { FormEvent, useState } from "react";
import Modal from "@/components/Modal";
import SearchBar from "@/components/SearchBar";
import SearchSelect from "@/components/SearchSelect";
import SkeletonRows from "@/components/SkeletonRows";
import { ApiError } from "@/lib/api";
import { Category } from "./categories.types";
import { createCategory, deleteCategory, updateCategory } from "./categories.api";
import { useAllCategories, useCategories } from "./categories.hooks";

export default function CategoriesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { categories, total, totalPages, loading, error, setError, reload } = useCategories(page, search);
  const { allCategories, reload: reloadAll } = useAllCategories();

  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  function onSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function openCreate() {
    setEditingId(null);
    setName("");
    setFormError("");
    setShowModal(true);
  }

  function openEdit(c: Category) {
    setEditingId(c.id);
    setName(c.name);
    setFormError("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    const trimmed = name.trim();
    if (!trimmed) {
      setFormError("Le nom de la catégorie est requis");
      return;
    }
    setSubmitting(true);
    try {
      if (editingId) {
        await updateCategory(editingId, trimmed);
      } else {
        await createCategory(trimmed);
        setPage(1);
      }
      closeModal();
      await reload();
      reloadAll();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Erreur lors de l'enregistrement");
    } finally {
      setSubmitting(false);
    }
  }

  async function onDelete(id: number) {
    if (!confirm("Supprimer cette catégorie ?")) return;
    try {
      await deleteCategory(id);
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur lors de la suppression");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900">Catégories</h1>
        <button
          onClick={openCreate}
          className="bg-blue-600 text-white rounded-md px-3 sm:px-4 py-2 text-sm font-medium hover:bg-blue-700"
        >
          + Ajouter catégorie
        </button>
      </div>

      <SearchBar value={search} onChange={onSearchChange} placeholder="Rechercher une catégorie..." />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full min-w-[400px] text-sm">
          <thead className="bg-gray-50 text-gray-600 text-left">
            <tr>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <SkeletonRows cols={2} />}
            {!loading && categories.length === 0 && (
              <tr>
                <td colSpan={2} className="px-4 py-6 text-center text-gray-400">Aucune catégorie</td>
              </tr>
            )}
            {categories.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="px-4 py-3 font-medium uppercase">{c.name}</td>
                <td className="px-4 py-3 text-right space-x-3">
                  <button onClick={() => openEdit(c)} className="text-blue-600 hover:underline">
                    Modifier
                  </button>
                  <button onClick={() => onDelete(c.id)} className="text-red-600 hover:underline">
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-gray-500">
            <span>
              {total} catégorie{total > 1 ? "s" : ""} — page {page} / {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-md border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
              >
                Précédent
              </button>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-md border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <Modal title={editingId ? "Modifier la catégorie" : "Ajouter une catégorie"} onClose={closeModal}>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nom</label>
              <SearchSelect
                options={allCategories
                  .filter((c) => c.id !== editingId)
                  .map((c) => ({ id: c.id, label: c.name }))}
                allowFreeText
                freeTextValue={name}
                onFreeTextChange={setName}
                placeholder="Nom de la catégorie"
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
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 text-gray-500 hover:text-gray-800"
              >
                Annuler
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
