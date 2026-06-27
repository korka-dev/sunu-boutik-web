"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import SearchSelect from "@/components/SearchSelect";
import { api, ApiError, Client, ClientList, Invoice, Product, ProductList } from "@/lib/api";

interface LineItem {
  product_id: number;
  quantity: number;
  saleUnit: "unite" | "carton";
}

export default function NewInvoiceModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (invoice: Invoice) => void;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState<number | "">("");
  const [lines, setLines] = useState<LineItem[]>([{ product_id: 0, quantity: 1, saleUnit: "unite" }]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<ProductList>("/products?page_size=100"),
      api.get<ClientList>("/clients?page_size=100"),
    ]).then(([p, c]) => {
      setProducts(p.items);
      setClients(c.items);
    });
  }, []);

  function updateLine(index: number, patch: Partial<LineItem>) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  function addLine() {
    setLines((prev) => [...prev, { product_id: 0, quantity: 1, saleUnit: "unite" }]);
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  function productOf(id: number) {
    return products.find((p) => p.id === id);
  }

  function baseQuantity(line: LineItem) {
    const product = productOf(line.product_id);
    const packSize = product?.pack_size || 1;
    return line.saleUnit === "carton" ? line.quantity * packSize : line.quantity;
  }

  const total = lines.reduce((sum, l) => {
    const p = productOf(l.product_id);
    return sum + (p ? p.unit_price * baseQuantity(l) : 0);
  }, 0);

  async function onSubmit() {
    setError("");
    const validLines = lines
      .filter((l) => l.product_id && l.quantity > 0)
      .map((l) => ({ product_id: l.product_id, quantity: baseQuantity(l) }));
    if (validLines.length === 0) {
      setError("Ajoutez au moins un article valide");
      return;
    }
    setSubmitting(true);
    try {
      const invoice = await api.post<Invoice>("/invoices", {
        client_id: clientId || null,
        note: null,
        lines: validLines,
      });
      onCreated(invoice);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur lors de la création de la facture");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Nouvelle facture" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Client</label>
          <SearchSelect
            options={clients.map((c) => ({ id: c.id, label: c.name, sublabel: c.phone || undefined }))}
            value={clientId}
            onChange={setClientId}
            placeholder="Rechercher un client..."
            allowEmpty
            emptyLabel="-- Aucun --"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Articles</label>
          {lines.map((line, i) => {
            const product = productOf(line.product_id);
            const lineTotal = product ? product.unit_price * baseQuantity(line) : 0;
            const hasPack = (product?.pack_size || 1) > 1;
            return (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:items-center border-b sm:border-0 pb-3 sm:pb-0">
                <SearchSelect
                  className="sm:col-span-4"
                  options={products.map((p) => ({
                    id: p.id,
                    label: p.name,
                    sublabel: `${p.quantity} dispo.${p.pack_size > 1 ? ` — carton de ${p.pack_size}` : ""}`,
                  }))}
                  value={line.product_id || ""}
                  onChange={(id) => updateLine(i, { product_id: id || 0, saleUnit: "unite" })}
                  placeholder="Rechercher un article..."
                />
                {hasPack ? (
                  <select
                    value={line.saleUnit}
                    onChange={(e) => updateLine(i, { saleUnit: e.target.value as "unite" | "carton" })}
                    className="sm:col-span-2 rounded-md border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="unite">À l&apos;unité</option>
                    <option value="carton">Par carton</option>
                  </select>
                ) : (
                  <div className="hidden sm:block sm:col-span-2" />
                )}
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={line.quantity}
                  onChange={(e) => updateLine(i, { quantity: Number(e.target.value) })}
                  className="sm:col-span-2 rounded-md border border-gray-300 px-3 py-2"
                />
                <div className="sm:col-span-2 flex items-center justify-between sm:justify-end text-sm text-gray-600">
                  <span className="sm:hidden">Sous-total</span>
                  {lineTotal.toLocaleString()} FCFA
                </div>
                <button
                  type="button"
                  onClick={() => removeLine(i)}
                  className="sm:col-span-2 text-red-600 hover:underline text-sm text-left"
                >
                  Retirer
                </button>
              </div>
            );
          })}
          <button type="button" onClick={addLine} className="text-blue-600 text-sm hover:underline">
            + Ajouter une ligne
          </button>
        </div>

        <div className="flex items-center justify-between border-t pt-4">
          <p className="font-semibold text-lg">Total: {total.toLocaleString()} FCFA</p>
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            className="bg-blue-600 text-white rounded-md px-5 py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Création..." : "Créer la facture"}
          </button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  );
}
