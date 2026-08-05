"use client";

import { useCallback, useEffect, useState } from "react";
import SearchSelect from "@/components/SearchSelect";
import { ApiError } from "@/lib/api";
import { Client } from "@/features/clients/clients.types";
import { fetchAllClients } from "@/features/clients/clients.api";
import { Product } from "@/features/products/products.types";
import { fetchAllProducts } from "@/features/products/products.api";
import { createInvoice, updateInvoice } from "./factures.api";
import { Invoice } from "./factures.types";
import { LineItem, isLineValid, linesFromInvoice, toApiLine } from "./factures.lineLogic";
import { useInvoiceLines } from "./useInvoiceLines";
import InvoiceLinesEditor from "./InvoiceLinesEditor";

const DRAFT_KEY = "invoice_draft";

interface Draft {
  clientId: number | "";
  clientName: string;
  lines: LineItem[];
}

function loadDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
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
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);

  const saveDraft = useCallback(
    (cId: number | "", cName: string, ls: LineItem[]) => {
      if (isEdit) return;
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ clientId: cId, clientName: cName, lines: ls }));
    },
    [isEdit]
  );

  const linesState = useInvoiceLines(invoice ? linesFromInvoice(invoice) : [], {
    products,
    onLinesChange: (ls) => saveDraft(clientId, clientName, ls),
  });
  const { lines, resetAll } = linesState;

  useEffect(() => {
    Promise.all([fetchAllProducts(), fetchAllClients()]).then(([p, c]) => {
      setProducts(p);
      setClients(c);
      if (isEdit) return;
      const draft = loadDraft();
      if (draft) {
        setClientId(draft.clientId);
        setClientName(draft.clientName);
        resetAll(draft.lines.filter(isLineValid));
        setDraftRestored(true);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setClientIdAndSave(id: number | "") {
    setClientId(id);
    saveDraft(id, clientName, lines);
  }

  function setClientNameAndSave(name: string) {
    setClientName(name);
    saveDraft(clientId, name, lines);
  }

  function clearDraft() {
    localStorage.removeItem(DRAFT_KEY);
    setClientId("");
    setClientName("");
    resetAll([]);
    setDraftRestored(false);
  }

  async function onSubmit() {
    setError("");
    const validLines = lines.filter(isLineValid).map((l) => toApiLine(products, l));
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
      const result = isEdit ? await updateInvoice(invoice!.id, payload) : await createInvoice(payload);
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
        <InvoiceLinesEditor products={products} state={linesState} />
      </div>

      <div className="flex items-center justify-end border-t pt-4">
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
