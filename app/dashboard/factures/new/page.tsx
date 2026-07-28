"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SearchSelect from "@/components/SearchSelect";
import { api, ApiError, Client, ClientList, Invoice, Product, ProductList } from "@/lib/api";
import { createInvoiceOffline, getProductsOffline, getClientsOffline } from "@/lib/offline-store";
import { useAuth } from "@/lib/auth-context";

const DRAFT_KEY = "invoice_draft";

interface LineItem {
  product_id: number;
  quantity: number | "";
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

export default function NewFacturePage() {
  const router = useRouter();
  const { shop } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState<number | "">("");
  const [clientName, setClientName] = useState("");
  const [lines, setLines] = useState<LineItem[]>([defaultLine()]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);

  useEffect(() => {
    async function loadData() {
      const shopId = shop?.id;

      if (shopId) {
        const [localProds, localClients] = await Promise.all([
          getProductsOffline(shopId),
          getClientsOffline(shopId),
        ]);
        if (localProds.length > 0) {
          setProducts(localProds.map((p) => ({ ...p, id: p.serverId ?? p.localId! })));
        }
        if (localClients.length > 0) {
          setClients(localClients.map((c) => ({ ...c, id: c.serverId ?? c.localId!, created_at: c.created_at })));
        }
      }

      if (navigator.onLine) {
        try {
          const [p, c] = await Promise.all([
            api.get<ProductList>("/products?page_size=200"),
            api.get<ClientList>("/clients?page_size=200"),
          ]);
          setProducts(p.items);
          setClients(c.items);
        } catch {
          // On garde les données locales
        }
      }

      const draft = loadDraft();
      if (draft) {
        setClientId(draft.clientId);
        setClientName(draft.clientName);
        setLines(draft.lines.length > 0 ? draft.lines : [defaultLine()]);
        setDraftRestored(true);
      }
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shop?.id]);

  const saveDraft = useCallback((cId: number | "", cName: string, ls: LineItem[]) => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ clientId: cId, clientName: cName, lines: ls }));
  }, []);

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

  function productOf(id: number) {
    return products.find((p) => p.id === id);
  }

  function numericQuantity(quantity: number | ""): number {
    return quantity === "" ? 0 : quantity;
  }

  function baseQuantity(line: LineItem) {
    const product = productOf(line.product_id);
    const packSize = product?.pack_size || 1;
    const qty = numericQuantity(line.quantity);
    return line.saleUnit === "carton" ? qty * packSize : qty;
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
      .filter((l) => l.product_id && l.quantity !== "" && l.quantity > 0)
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
    setSubmitting(true);
    try {
      if (navigator.onLine) {
        const result = await api.post<Invoice>("/invoices", {
          client_id: clientId || null,
          client_name: clientId ? null : clientName.trim() || null,
          note: null,
          lines: validLines,
        });
        localStorage.removeItem(DRAFT_KEY);
        router.push(`/dashboard/factures/${result.id}`);
      } else {
        const localProds = shop?.id ? await getProductsOffline(shop.id) : [];
        const inv = await createInvoiceOffline(
          {
            client_id: clientId || null,
            client_name: clientId ? null : clientName.trim() || null,
            note: null,
            lines: validLines,
          },
          shop!.id,
          localProds
        );
        localStorage.removeItem(DRAFT_KEY);
        router.push(`/dashboard/factures/offline/${inv.localId}`);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur lors de la création de la facture");
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">Nouvelle facture</h2>
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:underline">
          ← Retour
        </button>
      </div>

      {draftRestored && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm text-amber-800">
          <span>Brouillon restauré depuis votre dernière session.</span>
          <button
            onClick={() => {
              localStorage.removeItem(DRAFT_KEY);
              setClientId("");
              setClientName("");
              setLines([defaultLine()]);
              setDraftRestored(false);
            }}
            className="ml-4 underline text-amber-700 hover:text-amber-900"
          >
            Effacer
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow p-6 space-y-5">
        {/* Client */}
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

        {/* Lignes */}
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
                    step="0.1"
                    min="1"
                    value={line.quantity}
                    onChange={(e) => updateLine(i, { quantity: e.target.value === "" ? "" : Number(e.target.value) })}
                    className="col-span-3 sm:col-span-2 rounded-md border border-gray-300 px-2 py-2 text-sm"
                    placeholder="Qté"
                  />
                  <input
                    type="number"
                    step="1"
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

        {/* Total + soumettre */}
        <div className="flex items-center justify-between border-t pt-4">
          <p className="font-semibold text-xl tabular-nums">
            Total : {total.toLocaleString()} FCFA
          </p>
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            className="bg-blue-600 text-white rounded-md px-6 py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Création..." : "Créer la facture"}
          </button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
