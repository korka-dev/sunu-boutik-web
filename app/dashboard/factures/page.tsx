"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import NewInvoiceModal from "@/components/NewInvoiceModal";
import { api, ApiError, Invoice } from "@/lib/api";

export default function FacturesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);

  function load() {
    setLoading(true);
    api
      .get<Invoice[]>("/invoices")
      .then(setInvoices)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Erreur de chargement"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function onCreated(invoice: Invoice) {
    setShowModal(false);
    router.push(`/dashboard/factures/${invoice.id}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold text-lg">Factures</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white rounded-md px-3 sm:px-4 py-2 text-sm font-medium hover:bg-blue-700"
        >
          + Nouvelle facture
        </button>
      </div>

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
            {loading && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-400">Chargement...</td>
              </tr>
            )}
            {!loading && invoices.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-400">Aucune facture</td>
              </tr>
            )}
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-t">
                <td className="px-4 py-3 font-medium">{inv.number}</td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(inv.created_at).toLocaleString("fr-FR")}
                </td>
                <td className="px-4 py-3 text-right">{inv.total.toLocaleString()} FCFA</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/dashboard/factures/${inv.id}`} className="text-blue-600 hover:underline">
                    Voir / Imprimer
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && <NewInvoiceModal onClose={() => setShowModal(false)} onCreated={onCreated} />}
    </div>
  );
}
