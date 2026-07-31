"use client";

import { FormEvent, useEffect, useState } from "react";
import SearchSelect from "@/components/SearchSelect";
import SkeletonRows from "@/components/SkeletonRows";
import {
  api,
  ApiError,
  fetchAllPages,
  Product,
  ProductList,
  TransformationDirection,
  TransformationLog,
  TransformationLogList,
  TransformationResult,
} from "@/lib/api";

const PAGE_SIZE = 20;

export default function TransformationsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState<number | "">("");
  const [direction, setDirection] = useState<TransformationDirection>("to_secondaire");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [history, setHistory] = useState<TransformationLog[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");

  function loadProducts() {
    fetchAllPages<Product>("/products?transformable_only=true", api.get<ProductList>)
      .then(setProducts)
      .catch(() => {});
  }

  async function loadHistory() {
    setHistoryLoading(true);
    setHistoryError("");
    try {
      const list = await api.get<TransformationLogList>(`/transformations/history?page=${page}&page_size=${PAGE_SIZE}`);
      setHistory(list.items);
      setTotalPages(list.total_pages);
      setTotal(list.total);
    } catch (err) {
      setHistoryError(err instanceof ApiError ? err.message : "Erreur de chargement de l'historique");
    } finally {
      setHistoryLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const product = products.find((p) => p.id === productId);

  const fromLabel = product ? (direction === "to_secondaire" ? product.unit : product.unit_secondaire) : "";
  const toLabel = product ? (direction === "to_secondaire" ? product.unit_secondaire : product.unit) : "";
  const availableFrom = product
    ? direction === "to_secondaire"
      ? product.quantity
      : product.quantity_secondaire
    : 0;

  const parsedQuantity = parseFloat(quantity);
  const resultQuantity =
    product && product.conversion_ratio && !Number.isNaN(parsedQuantity) && parsedQuantity > 0
      ? direction === "to_secondaire"
        ? parsedQuantity * product.conversion_ratio
        : parsedQuantity / product.conversion_ratio
      : null;

  function resetForm() {
    setProductId("");
    setDirection("to_secondaire");
    setQuantity("");
    setNote("");
    setFormError("");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    setSuccessMessage("");

    if (!productId) {
      setFormError("Choisissez un article transformable");
      return;
    }
    if (quantity === "" || Number.isNaN(parsedQuantity) || parsedQuantity <= 0) {
      setFormError("La quantité à transformer doit être un nombre positif");
      return;
    }
    if (product && parsedQuantity > availableFrom) {
      setFormError(`Stock insuffisant : ${availableFrom} ${fromLabel} disponible(s)`);
      return;
    }

    setSubmitting(true);
    try {
      const result = await api.post<TransformationResult>("/transformations/execute", {
        product_id: productId,
        direction,
        quantity: parsedQuantity,
        note: note.trim() || null,
      });
      setSuccessMessage(
        `${result.log.quantity_from} ${result.log.unit_from} transformé(s) en ${result.log.quantity_to} ${result.log.unit_to}.`
      );
      resetForm();
      loadProducts();
      setPage(1);
      loadHistory();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Erreur lors de la transformation");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Transformations</h1>

      <div className="bg-white rounded-xl shadow p-4 sm:p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Transformer un article</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Article</label>
            {products.length === 0 ? (
              <p className="text-xs text-gray-400">
                Aucun article transformable pour l&apos;instant. Cochez &laquo;&nbsp;Cet article est
                transformable&nbsp;&raquo; dans le formulaire d&apos;un article pour en créer un.
              </p>
            ) : (
              <SearchSelect
                options={products.map((p) => ({
                  id: p.id,
                  label: p.name,
                  sublabel: `${p.quantity} ${p.unit} / ${p.quantity_secondaire} ${p.unit_secondaire} dispo.`,
                }))}
                value={productId}
                onChange={(id) => {
                  setProductId(id);
                  setDirection("to_secondaire");
                }}
                placeholder="Rechercher un article transformable..."
              />
            )}
          </div>

          {product && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Sens de la transformation</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDirection("to_secondaire")}
                    className={`rounded-md border px-3 py-2 text-sm font-medium ${
                      direction === "to_secondaire"
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-gray-300 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {product.unit} → {product.unit_secondaire}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirection("to_principale")}
                    className={`rounded-md border px-3 py-2 text-sm font-medium ${
                      direction === "to_principale"
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-gray-300 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {product.unit_secondaire} → {product.unit}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 items-end">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Quantité de {fromLabel} à transformer ({availableFrom} dispo.)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
                <div className="text-sm text-gray-600 pb-2">
                  {resultQuantity !== null ? (
                    <span>
                      → <span className="font-semibold text-gray-900">{resultQuantity.toLocaleString()}</span> {toLabel}
                    </span>
                  ) : (
                    <span className="text-gray-400">Saisissez une quantité</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Note (optionnel)</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  placeholder="Ex: préparation pour le marché du samedi"
                />
              </div>
            </>
          )}

          {formError && <p className="text-sm text-red-600">{formError}</p>}
          {successMessage && <p className="text-sm text-green-600">{successMessage}</p>}

          <button
            type="submit"
            disabled={submitting || !product}
            className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Transformation..." : "Transformer"}
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-2">Historique</h2>
        {historyError && <p className="text-sm text-red-600 mb-2">{historyError}</p>}
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-gray-50 text-gray-600 text-left">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Article</th>
                <th className="px-4 py-3">Transformation</th>
                <th className="px-4 py-3">Par</th>
                <th className="px-4 py-3">Note</th>
              </tr>
            </thead>
            <tbody>
              {historyLoading && <SkeletonRows cols={5} />}
              {!historyLoading && history.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                    Aucune transformation pour l&apos;instant
                  </td>
                </tr>
              )}
              {history.map((h) => (
                <tr key={h.id} className="border-t">
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {new Date(h.created_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                  </td>
                  <td className="px-4 py-3 font-medium">{h.product_name}</td>
                  <td className="px-4 py-3">
                    {h.quantity_from} {h.unit_from} → {h.quantity_to} {h.unit_to}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{h.created_by_name || "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{h.note || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {!historyLoading && total > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-gray-500">
              <span>
                {total} transformation{total > 1 ? "s" : ""} — page {page} / {totalPages}
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
      </div>
    </div>
  );
}
