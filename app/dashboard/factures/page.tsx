"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NewInvoiceModal from "@/components/NewInvoiceModal";
import SearchBar from "@/components/SearchBar";
import SkeletonRows from "@/components/SkeletonRows";
import { api, ApiError, Invoice, InvoiceList } from "@/lib/api";

const PAGE_SIZE = 20;

export default function FacturesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [date, setDate] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE) });
      if (search) params.set("search", search);
      if (date) params.set("date", date);
      const list = await api.get<InvoiceList>(`/invoices?${params.toString()}`);
      setInvoices(list.items);
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
  }, [page, search, date]);

  function onSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function onDateChange(value: string) {
    setDate(value);
    setPage(1);
  }

  function onCreated(invoice: Invoice) {
    setShowModal(false);
    router.push(`/dashboard/factures/${invoice.id}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold text-lg">Factures</h2>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {date && (
            <button onClick={() => onDateChange("")} className="text-sm text-gray-500 hover:underline">
              Effacer
            </button>
          )}
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white rounded-md px-3 sm:px-4 py-2 text-sm font-medium hover:bg-blue-700"
          >
            + Nouvelle facture
          </button>
        </div>
      </div>

      <SearchBar
        value={search}
        onChange={onSearchChange}
        placeholder="Rechercher une facture (numéro)..."
        maxWidthClassName="max-w-2xl"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead className="bg-gray-50 text-gray-600 text-left">
            <tr>
              <th className="px-4 py-3">Numéro</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <SkeletonRows cols={4} />}
            {!loading && invoices.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-400">Aucune facture</td>
              </tr>
            )}
            {invoices.map((inv) => (
              <tr
                key={inv.id}
                onClick={() => router.push(`/dashboard/factures/${inv.id}`)}
                className="border-t cursor-pointer hover:bg-gray-50"
              >
                <td className="px-4 py-3 font-medium">{inv.number}</td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(inv.created_at).toLocaleString("fr-FR")}
                </td>
                <td className="px-4 py-3 text-right">{inv.total.toLocaleString()} FCFA</td>
                <td className="px-4 py-3 text-right">
                  <span className="text-blue-600 hover:underline">Voir / Modifier</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-gray-500">
            <span>
              {total} facture{total > 1 ? "s" : ""} — page {page} / {totalPages}
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

      {showModal && <NewInvoiceModal onClose={() => setShowModal(false)} onCreated={onCreated} />}
    </div>
  );
}
