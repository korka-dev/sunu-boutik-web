"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SkeletonRows from "@/components/SkeletonRows";
import { api, ApiError, CaisseEntry, CaisseJournal, CaisseSummary } from "@/lib/api";

const PAGE_SIZE = 20;

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function CaissePage() {
  const router = useRouter();
  const [date, setDate] = useState(todayStr);
  const [summary, setSummary] = useState<CaisseSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState("");

  const [entries, setEntries] = useState<CaisseEntry[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [entriesLoading, setEntriesLoading] = useState(true);
  const [entriesError, setEntriesError] = useState("");

  async function loadSummary() {
    setSummaryLoading(true);
    setSummaryError("");
    try {
      const data = await api.get<CaisseSummary>(`/caisse/summary?date=${date}`);
      setSummary(data);
    } catch (err) {
      setSummaryError(err instanceof ApiError ? err.message : "Erreur de chargement");
    } finally {
      setSummaryLoading(false);
    }
  }

  async function loadJournal() {
    setEntriesLoading(true);
    setEntriesError("");
    try {
      const params = new URLSearchParams({ date, page: String(page), page_size: String(PAGE_SIZE) });
      const data = await api.get<CaisseJournal>(`/caisse/journal?${params.toString()}`);
      setEntries(data.items);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch (err) {
      setEntriesError(err instanceof ApiError ? err.message : "Erreur de chargement");
    } finally {
      setEntriesLoading(false);
    }
  }

  useEffect(() => {
    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  useEffect(() => {
    loadJournal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, page]);

  function onDateChange(value: string) {
    setDate(value);
    setPage(1);
  }

  const isToday = date === todayStr();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900">Journal de caisse</h1>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {!isToday && (
            <button onClick={() => onDateChange(todayStr())} className="text-sm text-gray-500 hover:underline">
              Aujourd&apos;hui
            </button>
          )}
        </div>
      </div>

      {summaryError && <p className="text-sm text-red-600">{summaryError}</p>}

      {summaryLoading && <p className="text-gray-400 text-sm">Chargement...</p>}

      {!summaryLoading && summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Factures" value={summary.invoices_count} />
          <StatCard label="Total facturé" value={`${summary.total_invoiced.toLocaleString()} FCFA`} />
          <StatCard label="Total encaissé" value={`${summary.total_collected.toLocaleString()} FCFA`} />
          <StatCard
            label="Reste à encaisser"
            value={`${summary.remaining.toLocaleString()} FCFA`}
            highlight={summary.remaining > 0}
          />
        </div>
      )}

      {entriesError && <p className="text-sm text-red-600">{entriesError}</p>}

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead className="bg-gray-50 text-gray-600 text-left">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Facture</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3 text-right">Montant encaissé</th>
            </tr>
          </thead>
          <tbody>
            {entriesLoading && <SkeletonRows cols={4} />}
            {!entriesLoading && entries.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                  Aucun encaissement pour cette date
                </td>
              </tr>
            )}
            {!entriesLoading &&
              entries.map((entry) => (
                <tr
                  key={entry.id}
                  onClick={() => router.push(`/dashboard/factures/${entry.invoice_id}`)}
                  className="border-t cursor-pointer hover:bg-gray-50"
                >
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(entry.created_at).toLocaleString("fr-FR")}
                  </td>
                  <td className="px-4 py-3 font-medium">{entry.invoice_number}</td>
                  <td className="px-4 py-3">{entry.client_name}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    {entry.amount.toLocaleString()} FCFA
                  </td>
                </tr>
              ))}
          </tbody>
        </table>

        {!entriesLoading && total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-gray-500">
            <span>
              {total} encaissement{total > 1 ? "s" : ""} — page {page} / {totalPages}
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
  );
}

function StatCard({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={`rounded-xl shadow p-4 ${highlight ? "bg-amber-50" : "bg-white"}`}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
