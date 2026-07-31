"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import InvoiceCopiesView from "@/components/InvoiceCopiesView";
import InvoiceStatusBadge from "@/components/InvoiceStatusBadge";
import PaymentHistory from "@/components/PaymentHistory";
import PaymentModal from "@/components/PaymentModal";
import { api, ApiError, fetchPdfBlob, Client, Invoice, PdfFormat, Shop } from "@/lib/api";

type ViewFormat = PdfFormat | "copies";

export default function FactureDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = Number(params.id);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: number; full_name: string } | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [error, setError] = useState("");
  const [format, setFormat] = useState<ViewFormat>("copies");
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  function loadInvoice() {
    Promise.all([
      api.get<Invoice>(`/invoices/${invoiceId}`),
      api.get<{ user: { id: number; full_name: string }; shop: Shop | null }>("/auth/me"),
    ])
      .then(([inv, me]) => {
        setInvoice(inv);
        setShop(me.shop);
        setCurrentUser(me.user);
      })
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
    if (!invoice?.client_id) {
      setClient(null);
      return;
    }
    api
      .get<Client>(`/clients/${invoice.client_id}`)
      .then(setClient)
      .catch(() => setClient(null));
  }, [invoice?.client_id]);

  useEffect(() => {
    if (format === "copies") return;
    loadPdf(format);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId, format]);

  function handlePrint() {
    if (format === "copies") {
      window.print();
    } else {
      iframeRef.current?.contentWindow?.print();
    }
  }

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!invoice || !shop) return <p className="text-gray-400">Chargement...</p>;

  const printDisabled = format !== "copies" && (!pdfBlobUrl || pdfLoading);

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
            <button
              onClick={() => setFormat("copies")}
              className={`px-3 py-1.5 font-medium transition-colors border-l border-gray-300 ${
                format === "copies" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              2 exemplaires
            </button>
          </div>
          <button
            onClick={() => router.push(`/dashboard/factures/${invoiceId}/edit`)}
            className="border border-gray-300 rounded-md px-3 sm:px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Modifier
          </button>
          <button
            onClick={handlePrint}
            disabled={printDisabled}
            className="bg-blue-600 text-white rounded-md px-3 sm:px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            Imprimer
          </button>
          {format !== "copies" && pdfBlobUrl && !pdfLoading && (
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

      <div className="no-print bg-white rounded-xl shadow px-4 sm:px-5 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm">
          <InvoiceStatusBadge status={invoice.status} />
          <div>
            <span className="text-gray-500">Payé : </span>
            <span className="font-medium">{invoice.amount_paid.toLocaleString()} FCFA</span>
          </div>
          <div>
            <span className="text-gray-500">Reste à payer : </span>
            <span className="font-semibold text-blue-700">{invoice.balance_due.toLocaleString()} FCFA</span>
          </div>
        </div>
        {invoice.status !== "paid" && (
          <button
            onClick={() => setShowPaymentModal(true)}
            className="bg-green-600 text-white rounded-md px-3 sm:px-4 py-2 text-sm font-medium hover:bg-green-700"
          >
            Encaisser
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        {format === "copies" ? (
          <InvoiceCopiesView invoice={invoice} shop={shop} client={client} />
        ) : pdfLoading ? (
          <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
            Génération du PDF...
          </div>
        ) : pdfBlobUrl ? (
          <iframe
            ref={iframeRef}
            src={pdfBlobUrl}
            className={format === "ticket" ? "w-full h-[60vh] sm:h-[600px]" : "w-full h-[70vh] sm:h-[800px]"}
            title="Facture"
          />
        ) : (
          <p className="p-6 text-gray-400">Génération du PDF...</p>
        )}
      </div>

      <PaymentHistory
        invoiceId={invoiceId}
        currentUser={currentUser}
        refreshKey={invoice.amount_paid}
        onVoided={loadInvoice}
      />

      {showPaymentModal && (
        <PaymentModal
          invoice={invoice}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            setShowPaymentModal(false);
            loadInvoice();
          }}
        />
      )}
    </div>
  );
}
