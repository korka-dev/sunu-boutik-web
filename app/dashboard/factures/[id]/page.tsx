"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import NewInvoiceModal from "@/components/NewInvoiceModal";
import { api, ApiError, fetchPdfBlob, Invoice } from "@/lib/api";

export default function FactureDetailPage() {
  const params = useParams();
  const invoiceId = Number(params.id);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState("");
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  function loadInvoice() {
    api
      .get<Invoice>(`/invoices/${invoiceId}`)
      .then(setInvoice)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Erreur de chargement"));
  }

  function loadPdf() {
    let url: string | null = null;
    fetchPdfBlob(invoiceId)
      .then((blob) => {
        url = URL.createObjectURL(blob);
        setPdfBlobUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
      })
      .catch(() => {});
  }

  useEffect(() => {
    loadInvoice();
    loadPdf();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId]);

  function printPdf() {
    if (!pdfBlobUrl) return;
    const win = window.open(pdfBlobUrl, "_blank");
    win?.addEventListener("load", () => win.print());
  }

  function onUpdated(updated: Invoice) {
    setShowEditModal(false);
    setInvoice(updated);
    loadPdf();
  }

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!invoice) return <p className="text-gray-400">Chargement...</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <h2 className="font-semibold text-lg">Facture {invoice.number}</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowEditModal(true)}
            className="border border-gray-300 rounded-md px-3 sm:px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Modifier
          </button>
          <button
            onClick={printPdf}
            className="bg-blue-600 text-white rounded-md px-3 sm:px-4 py-2 text-sm font-medium hover:bg-blue-700"
          >
            Imprimer
          </button>
          {pdfBlobUrl && (
            <a
              href={pdfBlobUrl}
              download={`facture-${invoice.number}.pdf`}
              className="border border-gray-300 rounded-md px-3 sm:px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Télécharger PDF
            </a>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {pdfBlobUrl ? (
          <iframe src={pdfBlobUrl} className="w-full h-[70vh] sm:h-[800px]" title="Facture" />
        ) : (
          <p className="p-6 text-gray-400">Génération du PDF...</p>
        )}
      </div>

      {showEditModal && (
        <NewInvoiceModal invoice={invoice} onClose={() => setShowEditModal(false)} onCreated={onUpdated} />
      )}
    </div>
  );
}
