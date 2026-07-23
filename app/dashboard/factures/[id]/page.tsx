"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import NewInvoiceModal from "@/components/NewInvoiceModal";
import { api, ApiError, fetchPdfBlob, Invoice, PdfFormat } from "@/lib/api";

export default function FactureDetailPage() {
  const params = useParams();
  const invoiceId = Number(params.id);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState("");
  const [format, setFormat] = useState<PdfFormat>("ticket");
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  function loadInvoice() {
    api
      .get<Invoice>(`/invoices/${invoiceId}`)
      .then(setInvoice)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Erreur de chargement"));
  }

  function loadPdf(fmt: PdfFormat) {
    setPdfLoading(true);
    fetchPdfBlob(invoiceId, fmt)
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        setPdfBlobUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
      })
      .catch(() => {})
      .finally(() => setPdfLoading(false));
  }

  useEffect(() => {
    loadInvoice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId]);

  useEffect(() => {
    loadPdf(format);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId, format]);

  function printPdf() {
    if (!pdfBlobUrl) return;
    const win = window.open(pdfBlobUrl, "_blank");
    win?.addEventListener("load", () => win.print());
  }

  function onUpdated(updated: Invoice) {
    setShowEditModal(false);
    setInvoice(updated);
    loadPdf(format);
  }

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!invoice) return <p className="text-gray-400">Chargement...</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <h2 className="font-semibold text-lg">Facture {invoice.number}</h2>
        <div className="flex flex-wrap items-center gap-2">
          {/* Format toggle */}
          <div className="flex rounded-md border border-gray-300 overflow-hidden text-sm">
            <button
              onClick={() => setFormat("ticket")}
              className={`px-3 py-1.5 font-medium transition-colors ${
                format === "ticket" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              Ticket
            </button>
            <button
              onClick={() => setFormat("a4")}
              className={`px-3 py-1.5 font-medium transition-colors border-l border-gray-300 ${
                format === "a4" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              A4
            </button>
          </div>
          <button
            onClick={() => setShowEditModal(true)}
            className="border border-gray-300 rounded-md px-3 sm:px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Modifier
          </button>
          <button
            onClick={printPdf}
            disabled={!pdfBlobUrl || pdfLoading}
            className="bg-blue-600 text-white rounded-md px-3 sm:px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            Imprimer
          </button>
          {pdfBlobUrl && !pdfLoading && (
            <a
              href={pdfBlobUrl}
              download={`facture-${invoice.number}-${format}.pdf`}
              className="border border-gray-300 rounded-md px-3 sm:px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Télécharger PDF
            </a>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {pdfLoading ? (
          <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
            Génération du PDF...
          </div>
        ) : pdfBlobUrl ? (
          <iframe
            src={pdfBlobUrl}
            className={format === "ticket" ? "w-full h-[60vh] sm:h-[600px]" : "w-full h-[70vh] sm:h-[800px]"}
            title="Facture"
          />
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
