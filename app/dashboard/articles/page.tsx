"use client";

import { FormEvent, useEffect, useState } from "react";
import Modal from "@/components/Modal";
import SearchBar from "@/components/SearchBar";
import SearchSelect from "@/components/SearchSelect";
import { IconChart } from "@/components/Icons";
import SkeletonRows from "@/components/SkeletonRows";
import { api, ApiError, Category, CategoryList, fetchAllPages, Product, ProductList, ProductStats } from "@/lib/api";

const emptyForm = {
  name: "",
  category_id: "" as number | "",
  unit_price: "",
  quantity: "",
  is_transformable: false,
  unit_principale: "",
  unit_secondaire: "",
  conversion_ratio: "",
  unit_price_secondaire: "",
};
const PAGE_SIZE = 10;

export default function ArticlesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingQuantitySecondaire, setEditingQuantitySecondaire] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState("");

  function openStats() {
    setShowStats(true);
    setStatsLoading(true);
    setStatsError("");
    api
      .get<ProductStats>("/products/stats")
      .then(setStats)
      .catch((err) => setStatsError(err instanceof ApiError ? err.message : "Erreur de chargement"))
      .finally(() => setStatsLoading(false));
  }

  async function load() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE) });
      if (search) params.set("search", search);
      const list = await api.get<ProductList>(`/products?${params.toString()}`);
      setProducts(list.items);
      setTotalPages(list.total_pages);
      setTotal(list.total);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  function onSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  useEffect(() => {
    fetchAllPages<Category>("/categories", api.get<CategoryList>)
      .then(setCategories)
      .catch(() => {});
  }, []);

  function loadAllProducts() {
    fetchAllPages<Product>("/products", api.get<ProductList>)
      .then(setAllProducts)
      .catch(() => {});
  }

  useEffect(() => {
    loadAllProducts();
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setEditingQuantitySecondaire(0);
    setFormError("");
    setShowModal(true);
  }

  function openEdit(p: Product) {
    setEditingId(p.id);
    setForm({
      name: p.name,
      category_id: p.category_id,
      unit_price: String(p.unit_price),
      quantity: String(p.quantity),
      is_transformable: p.is_transformable,
      unit_principale: p.is_transformable ? p.unit : "",
      unit_secondaire: p.unit_secondaire || "",
      conversion_ratio: p.conversion_ratio != null ? String(p.conversion_ratio) : "",
      unit_price_secondaire: p.unit_price_secondaire != null ? String(p.unit_price_secondaire) : "",
    });
    setEditingQuantitySecondaire(p.quantity_secondaire);
    setFormError("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");

    const trimmedName = form.name.trim();
    if (!trimmedName) {
      setFormError("Le nom de l'article est requis");
      return;
    }
    if (!form.category_id) {
      setFormError("Choisissez une catégorie");
      return;
    }
    const unitPrice = parseFloat(form.unit_price);
    if (form.unit_price === "" || Number.isNaN(unitPrice) || unitPrice < 0) {
      setFormError("Le prix unitaire doit être un nombre positif");
      return;
    }
    const quantity = parseFloat(form.quantity);
    if (form.quantity === "" || Number.isNaN(quantity) || quantity < 0) {
      setFormError("La quantité en stock doit être un nombre positif");
      return;
    }

    const payload: Record<string, unknown> = {
      name: trimmedName,
      category_id: Number(form.category_id),
      unit_price: unitPrice,
      quantity,
      is_transformable: form.is_transformable,
    };

    if (form.is_transformable) {
      const unitPrincipale = form.unit_principale.trim();
      const unitSecondaire = form.unit_secondaire.trim();
      if (!unitPrincipale) {
        setFormError("Le nom de la forme principale est requis (ex: carton)");
        return;
      }
      if (!unitSecondaire) {
        setFormError("Le nom de la forme secondaire est requis (ex: seau)");
        return;
      }
      if (unitPrincipale.toLowerCase() === unitSecondaire.toLowerCase()) {
        setFormError("La forme principale et la forme secondaire doivent être différentes");
        return;
      }
      const ratio = parseFloat(form.conversion_ratio);
      if (form.conversion_ratio === "" || Number.isNaN(ratio) || ratio <= 0) {
        setFormError(`Indiquez combien de ${unitSecondaire || "forme secondaire"} vaut 1 ${unitPrincipale}`);
        return;
      }
      const priceSecondaire = parseFloat(form.unit_price_secondaire);
      if (form.unit_price_secondaire === "" || Number.isNaN(priceSecondaire) || priceSecondaire < 0) {
        setFormError(`Le prix unitaire de la forme secondaire (${unitSecondaire}) est requis`);
        return;
      }
      payload.unit = unitPrincipale;
      payload.unit_secondaire = unitSecondaire;
      payload.conversion_ratio = ratio;
      payload.unit_price_secondaire = priceSecondaire;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await api.patch(`/products/${editingId}`, payload);
      } else {
        await api.post("/products", payload);
        setPage(1);
      }
      closeModal();
      await load();
      loadAllProducts();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Erreur lors de l'enregistrement");
    } finally {
      setSubmitting(false);
    }
  }

  async function onDelete(id: number) {
    if (!confirm("Supprimer cet article ?")) return;
    try {
      await api.delete(`/products/${id}`);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur lors de la suppression");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900">Articles</h1>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <button
            onClick={openStats}
            className="flex items-center gap-2 border border-gray-300 rounded-md px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <IconChart className="w-4 h-4" />
            Statistiques
          </button>
          <button
            onClick={openCreate}
            className="bg-blue-600 text-white rounded-md px-3 sm:px-4 py-2 text-sm font-medium hover:bg-blue-700"
          >
            + Ajouter article
          </button>
        </div>
      </div>

      <SearchBar value={search} onChange={onSearchChange} placeholder="Rechercher un article..." />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead className="bg-gray-50 text-gray-600 text-left">
            <tr>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Catégorie</th>
              <th className="px-4 py-3 text-right">Prix unitaire</th>
              <th className="px-4 py-3 text-right">Stock</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <SkeletonRows cols={5} />}
            {!loading && products.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-400">Aucun article</td>
              </tr>
            )}
            {products.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="px-4 py-3 font-medium">
                  {p.name}
                  {p.is_transformable && (
                    <span className="ml-2 inline-block text-[10px] uppercase tracking-wide bg-blue-50 text-blue-600 rounded px-1.5 py-0.5 align-middle">
                      Transformable
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500">{p.category_name}</td>
                <td className="px-4 py-3 text-right">
                  {p.unit_price.toLocaleString()} FCFA
                  {p.is_transformable && (
                    <span className="block text-xs text-gray-400">
                      {p.unit_price_secondaire?.toLocaleString()} FCFA / {p.unit_secondaire}
                    </span>
                  )}
                </td>
                <td className={`px-4 py-3 text-right ${p.quantity <= 0 ? "text-red-600 font-semibold" : ""}`}>
                  {p.quantity} {p.is_transformable ? p.unit : ""}
                  {p.is_transformable && (
                    <span className="block text-xs text-gray-400 font-normal">
                      {p.quantity_secondaire} {p.unit_secondaire}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right space-x-3">
                  <button onClick={() => openEdit(p)} className="text-blue-600 hover:underline">
                    Modifier
                  </button>
                  <button onClick={() => onDelete(p.id)} className="text-red-600 hover:underline">
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
              {total} article{total > 1 ? "s" : ""} — page {page} / {totalPages}
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
        <Modal title={editingId ? "Modifier l'article" : "Ajouter un article"} onClose={closeModal}>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nom</label>
              <SearchSelect
                options={allProducts
                  .filter((p) => p.id !== editingId)
                  .map((p) => ({ id: p.id, label: p.name }))}
                allowFreeText
                freeTextValue={form.name}
                onFreeTextChange={(text) => setForm((f) => ({ ...f, name: text }))}
                placeholder="Nom de l'article"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Catégorie</label>
              {categories.length === 0 ? (
                <p className="text-xs text-amber-600">
                  Aucune catégorie pour l&apos;instant. Créez-en une dans l&apos;onglet Catégories avant
                  d&apos;ajouter un article.
                </p>
              ) : (
                <SearchSelect
                  options={categories.map((c) => ({ id: c.id, label: c.name }))}
                  value={form.category_id}
                  onChange={(id) => setForm({ ...form, category_id: id })}
                  placeholder="Rechercher une catégorie..."
                />
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Prix unitaire</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={form.unit_price}
                  onChange={(e) => setForm({ ...form, unit_price: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Quantité en stock{form.is_transformable && form.unit_principale ? ` (${form.unit_principale})` : ""}
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
            </div>

            <div className="border-t pt-3">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={form.is_transformable}
                  onChange={(e) => setForm({ ...form, is_transformable: e.target.checked })}
                  className="rounded border-gray-300"
                />
                Cet article est transformable
              </label>
              <p className="text-xs text-gray-400 mt-1">
                Ex: un carton de 5kg qui peut être détaché en plusieurs seaux.
              </p>
              {!form.is_transformable && editingQuantitySecondaire > 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  Il reste {editingQuantitySecondaire} unité(s) en forme secondaire pour cet article : elles
                  doivent d&apos;abord être retransformées (page Transformations) avant de pouvoir désactiver
                  cette option.
                </p>
              )}

              {form.is_transformable && (
                <div className="mt-3 space-y-3 bg-gray-50 rounded-md p-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Forme principale</label>
                      <input
                        type="text"
                        placeholder="Ex: carton"
                        value={form.unit_principale}
                        onChange={(e) => setForm({ ...form, unit_principale: e.target.value })}
                        className="w-full rounded-md border border-gray-300 px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Forme secondaire</label>
                      <input
                        type="text"
                        placeholder="Ex: seau"
                        value={form.unit_secondaire}
                        onChange={(e) => setForm({ ...form, unit_secondaire: e.target.value })}
                        className="w-full rounded-md border border-gray-300 px-3 py-2"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      1 {form.unit_principale || "forme principale"} = combien de {form.unit_secondaire || "forme secondaire"} ?
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.conversion_ratio}
                      onChange={(e) => setForm({ ...form, conversion_ratio: e.target.value })}
                      className="w-full rounded-md border border-gray-300 px-3 py-2"
                      placeholder="Ex: 4"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Prix unitaire ({form.unit_secondaire || "forme secondaire"})
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={form.unit_price_secondaire}
                      onChange={(e) => setForm({ ...form, unit_price_secondaire: e.target.value })}
                      className="w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                </div>
              )}
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

      {showStats && (
        <Modal title="Statistiques des articles" onClose={() => setShowStats(false)}>
          {statsLoading && <p className="text-gray-400 text-sm">Chargement...</p>}
          {statsError && <p className="text-sm text-red-600">{statsError}</p>}
          {stats && (
            <div className="grid grid-cols-2 gap-4">
              <StatBox label="Articles" value={stats.total_products} />
              <StatBox
                label="En rupture de stock"
                value={stats.out_of_stock_count}
                highlight={stats.out_of_stock_count > 0}
              />
              <StatBox label="Quantité totale en stock" value={stats.total_stock_quantity} />
              <StatBox label="Prix moyen" value={`${stats.average_price.toLocaleString(undefined, { maximumFractionDigits: 0 })} FCFA`} />
              <div className="col-span-2">
                <StatBox
                  label="Valeur totale du stock"
                  value={`${stats.total_stock_value.toLocaleString(undefined, { maximumFractionDigits: 0 })} FCFA`}
                />
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

function StatBox({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={`rounded-md px-4 py-3 ${highlight ? "bg-red-50" : "bg-gray-50"}`}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-xl font-bold mt-1 ${highlight ? "text-red-600" : "text-gray-900"}`}>{value}</p>
    </div>
  );
}
