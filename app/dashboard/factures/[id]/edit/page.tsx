"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import InvoiceForm from "@/components/InvoiceForm";
import { api, ApiError, Invoice } from "@/lib/api";

export default function EditFacturePage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = Number(params.id);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<Invoice>(`/invoices/${invoiceId}`)
      .then(setInvoice)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Erreur de chargement"));
  }, [invoiceId]);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!invoice) return <p className="text-gray-400">Chargement...</p>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">Modifier la facture {invoice.number}</h2>
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:underline">
          ← Retour
        </button>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <InvoiceForm invoice={invoice} onSaved={() => router.push(`/dashboard/factures/${invoiceId}`)} />
      </div>
    </div>
  );
}
