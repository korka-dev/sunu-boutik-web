"use client";

import { useCallback, useEffect, useState } from "react";
import SearchSelect from "@/components/SearchSelect";
import { api, ApiError, Client, ClientList, fetchAllPages, Invoice, Product, ProductList } from "@/lib/api";

const DRAFT_KEY = "invoice_draft";

interface LineItem {
  product_id: number;
  quantity: number;
  saleUnit: "unite" | "carton";
  unitPriceOverride: string;
}

interface Draft {
  clientId: number | "";
  clientName: string;
  lines: LineItem[];
}

const defaultLine = (): LineItem => ({ product_id: 0, quantity: 1, saleUnit: "unite", unitPriceOverride: "" });

function loadDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function linesFromInvoice(invoice: Invoice): LineItem[] {
  return invoice.lines.length > 0
    ? invoice.lines.map((l) => ({
        product_id: l.product_id,
        quantity: l.quantity,
        saleUnit: "unite" as const,
        unitPriceOverride: String(l.unit_price),
      }))
    : [defaultLine()];
}

export default function InvoiceForm({
  invoice,
  onSaved,
}: {
  invoice?: Invoice;
  onSaved: (invoice: Invoice) => void;
}) {
  const isEdit = !!invoice;
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState<number | "">(invoice?.client_id || "");
  const [clientName, setClientName] = useState(invoice?.client_name || "");
  const [lines, setLines] = useState<LineItem[]>(invoice ? linesFromInvoice(invoice) : [defaultLine()]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchAllPages<Product>("/products", api.get<ProductList>),
      fetchAllPages<Client>("/clients", api.get<ClientList>),
    ]).then(([p, c]) => {
      setProducts(p);
      setClients(c);
      if (isEdit) return;
      const draft = loadDraft();
      if (draft) {
        setClientId(draft.clientId);
        setClientName(draft.clientName);
        setLines(draft.lines.length > 0 ? draft.lines : [defaultLine()]);
        setDraftRestored(true);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveDraft = useCallback(
    (cId: number | "", cName: string, ls: LineItem[]) => {
      if (isEdit) return;
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ clientId: cId, clientName: cName, lines: ls }));
    },
    [isEdit]
  );

  function setClientIdAndSave(id: number | "") {
    setClientId(id);
    saveDraft(id, clientName, lines);
  }

  function setClientNameAndSave(name: string) {
    setClientName(name);
    saveDraft(clientId, name, lines);
  }

  function updateLine(index: number, patch: Partial<LineItem>) {
    setLines((prev) => {
      const next = prev.map((l, i) => (i === index ? { ...l, ...patch } : l));
      saveDraft(clientId, clientName, next);
      return next;
    });
  }

  function addLine() {
    setLines((prev) => {
      const next = [...prev, defaultLine()];
      saveDraft(clientId, clientName, next);
      return next;
    });
  }

  function removeLine(index: number) {
    setLines((prev) => {
      const next = prev.filter((_, i) => i !== index);
      saveDraft(clientId, clientName, next);
      return next;
    });
  }

  function clearDraft() {
    localStorage.removeItem(DRAFT_KEY);
    setClientId("");
    setClientName("");
    setLines([defaultLine()]);
    setDraftRestored(false);
  }

  function productOf(id: number) {
    return products.find((p) => p.id === id);
  }

  function baseQuantity(line: LineItem) {
    const product = productOf(line.product_id);
    const packSize = product?.pack_size || 1;
    return line.saleUnit === "carton" ? line.quantity * packSize : line.quantity;
  }

  function effectiveUnitPrice(line: LineItem) {
    const product = productOf(line.product_id);
    if (line.unitPriceOverride !== "" && !Number.isNaN(parseFloat(line.unitPriceOverride))) {
      return parseFloat(line.unitPriceOverride);
    }
    return product?.unit_price || 0;
  }

  const total = lines.reduce((sum, l) => sum + effectiveUnitPrice(l) * baseQuantity(l), 0);

  async function onSubmit() {
    setError("");
    const validLines = lines
      .filter((l) => l.product_id && l.quantity > 0)
      .map((l) => {
        const override = l.unitPriceOverride !== "" ? parseFloat(l.unitPriceOverride) : NaN;
        return {
          product_id: l.product_id,
          quantity: baseQuantity(l),
          unit_price: Number.isNaN(override) ? null : override,
        };
      });
    if (validLines.length === 0) {
      setError("Ajoutez au moins un article valide");
      return;
    }
    if (validLines.some((l) => l.unit_price !== null && l.unit_price < 0)) {
      setError("Le prix unitaire ne peut pas être négatif");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        client_id: clientId || null,
        client_name: clientId ? null : clientName.trim() || null,
        note: null,
        lines: validLines,
      };
      const result = isEdit
        ? await api.patch<Invoice>(`/invoices/${invoice!.id}`, payload)
        : await api.post<Invoice>("/invoices", payload);
      if (!isEdit) localStorage.removeItem(DRAFT_KEY);
      onSaved(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur lors de l'enregistrement de la facture");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      {!isEdit && draftRestored && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm text-amber-800">
          <span>Brouillon restauré depuis votre dernière session.</span>
          <button onClick={clearDraft} className="ml-4 underline text-amber-700 hover:text-amber-900">
            Effacer
          </button>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
        <SearchSelect
          options={clients.map((c) => ({ id: c.id, label: c.name, sublabel: c.phone || undefined }))}
          value={clientId}
          onChange={setClientIdAndSave}
          placeholder="Rechercher un client ou saisir un nom..."
          allowEmpty
          emptyLabel="-- Aucun --"
          allowFreeText
          freeTextValue={clientName}
          onFreeTextChange={setClientNameAndSave}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Articles</label>
        <div className="space-y-3">
          {lines.map((line, i) => {
            const product = productOf(line.product_id);
            const unitPrice = effectiveUnitPrice(line);
            const lineTotal = unitPrice * baseQuantity(line);
            const hasPack = (product?.pack_size || 1) > 1;
            return (
              <div key={i} className="grid grid-cols-12 gap-2 items-center border-b pb-3">
                <div className="col-span-12 sm:col-span-4">
                  <SearchSelect
                    options={products.map((p) => ({
                      id: p.id,
                      label: p.name,
                      sublabel: `${p.quantity} dispo.${p.pack_size > 1 ? ` — carton ${p.pack_size}` : ""}`,
                    }))}
                    value={line.product_id || ""}
                    onChange={(id) => {
                      const p = products.find((pr) => pr.id === id);
                      updateLine(i, { product_id: id || 0, saleUnit: "unite", unitPriceOverride: p ? String(p.unit_price) : "" });
                    }}
                    placeholder="Article..."
                  />
                </div>

                {hasPack ? (
                  <select
                    value={line.saleUnit}
                    onChange={(e) => updateLine(i, { saleUnit: e.target.value as "unite" | "carton" })}
                    className="col-span-6 sm:col-span-2 rounded-md border border-gray-300 px-2 py-2 text-sm"
                  >
                    <option value="unite">Unité</option>
                    <option value="carton">Carton</option>
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
                  className="col-span-3 sm:col-span-2 rounded-md border border-gray-300 px-2 py-2 text-sm"
                  placeholder="Qté"
                />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={line.unitPriceOverride}
                  onChange={(e) => updateLine(i, { unitPriceOverride: e.target.value })}
                  className="col-span-4 sm:col-span-2 rounded-md border border-gray-300 px-2 py-2 text-sm"
                  placeholder="Prix U"
                />
                <div className="col-span-4 sm:col-span-1 text-sm text-gray-600 text-right font-medium tabular-nums">
                  {lineTotal.toLocaleString()}
                </div>
                <button
                  type="button"
                  onClick={() => removeLine(i)}
                  className="col-span-1 text-red-500 hover:text-red-700 text-center text-lg font-bold"
                  title="Supprimer"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>

        <button type="button" onClick={addLine} className="mt-3 text-blue-600 text-sm hover:underline">
          + Ajouter une ligne
        </button>
      </div>

      <div className="flex items-center justify-between border-t pt-4">
        <p className="font-semibold text-xl tabular-nums">Total : {total.toLocaleString()} FCFA</p>
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="bg-blue-600 text-white rounded-md px-6 py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? "Enregistrement..." : isEdit ? "Enregistrer les modifications" : "Créer la facture"}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
