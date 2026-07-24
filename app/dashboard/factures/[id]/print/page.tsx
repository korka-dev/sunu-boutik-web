"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, ApiError, Invoice } from "@/lib/api";

const COPIES = ["ORIGINAL", "SOUCHE", "COMPTABILITÉ"] as const;

export default function PrintFacturePage() {
  const params = useParams();
  const invoiceId = Number(params.id);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [shopInfo, setShopInfo] = useState<{ name: string; address?: string; phone?: string; ninea?: string } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.get<Invoice>(`/invoices/${invoiceId}`),
      api.get<{ user: { full_name: string }; shop: { name: string; address?: string; phone?: string; ninea?: string } | null }>("/auth/me"),
    ])
      .then(([inv, me]) => {
        setInvoice(inv);
        setShopInfo(me.shop ?? { name: "" });
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Erreur de chargement"));
  }, [invoiceId]);

  if (error) return <p className="p-6 text-red-600">{error}</p>;
  if (!invoice || !shopInfo) return <p className="p-6 text-gray-400">Chargement...</p>;

  const date = new Date(invoice.created_at).toLocaleString("fr-FR");
  const clientLabel = invoice.client_name || null;

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
          .page { page-break-inside: avoid; }
        }
        @media screen {
          body { background: #e5e7eb; }
        }
        .copy {
          border: 1px solid #d1d5db;
          border-radius: 4px;
          padding: 12px 16px;
          font-family: Arial, sans-serif;
          font-size: 11px;
          color: #111;
          page-break-inside: avoid;
        }
        .copy + .copy { border-top: 2px dashed #9ca3af; }
        .copy-label {
          text-align: right;
          font-size: 9px;
          font-weight: bold;
          letter-spacing: 2px;
          color: #6b7280;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 4px;
          margin-bottom: 8px;
        }
        .shop-name { font-size: 14px; font-weight: bold; text-align: center; margin-bottom: 2px; }
        .shop-info { text-align: center; color: #555; font-size: 10px; margin-bottom: 6px; }
        .invoice-title { font-size: 12px; font-weight: bold; margin-bottom: 2px; }
        .invoice-meta { font-size: 10px; color: #555; margin-bottom: 8px; }
        table { width: 100%; border-collapse: collapse; margin-top: 6px; }
        th { font-size: 10px; font-weight: bold; border-top: 1px solid #111; border-bottom: 1px solid #111; padding: 3px 4px; }
        td { font-size: 10px; padding: 2px 4px; border-bottom: 1px solid #e5e7eb; }
        .text-right { text-align: right; }
        .text-left { text-align: left; }
        .total-row td { font-weight: bold; border-top: 1px solid #111; border-bottom: none; }
      `}</style>

      {/* Boutons écran */}
      <div className="no-print flex gap-3 justify-end p-4">
        <button
          onClick={() => window.history.back()}
          className="border border-gray-300 rounded-md px-4 py-2 text-sm hover:bg-gray-50"
        >
          ← Retour
        </button>
        <button
          onClick={() => window.print()}
          className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700"
        >
          Imprimer les 3 exemplaires
        </button>
      </div>

      {/* Conteneur A4 */}
      <div
        className="mx-auto bg-white"
        style={{ width: "210mm", minHeight: "297mm", padding: "8mm" }}
      >
        {COPIES.map((label) => (
          <div key={label} className="copy">
            <div className="copy-label">{label}</div>
            <div className="shop-name">{shopInfo.name}</div>
            <div className="shop-info">
              {shopInfo.address && <span>{shopInfo.address} — </span>}
              {shopInfo.phone && <span>Tél : {shopInfo.phone}</span>}
              {shopInfo.ninea && <span> — NINEA : {shopInfo.ninea}</span>}
            </div>

            <div className="invoice-title">Facture N° {invoice.number}</div>
            <div className="invoice-meta">
              Date : {date}
              {clientLabel && <span> — Client : {clientLabel}</span>}
            </div>

            <table>
              <thead>
                <tr>
                  <th className="text-right" style={{ width: "8%" }}>Qté</th>
                  <th className="text-left" style={{ width: "52%" }}>Article</th>
                  <th className="text-right" style={{ width: "20%" }}>Prix U</th>
                  <th className="text-right" style={{ width: "20%" }}>Prix T</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lines.map((line, i) => (
                  <tr key={i}>
                    <td className="text-right">{line.quantity % 1 === 0 ? line.quantity : line.quantity}</td>
                    <td className="text-left">{line.product_name}</td>
                    <td className="text-right">{line.unit_price.toLocaleString("fr-FR")}</td>
                    <td className="text-right">{line.line_total.toLocaleString("fr-FR")}</td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td colSpan={3} className="text-right">TOTAL</td>
                  <td className="text-right">{invoice.total.toLocaleString("fr-FR")} FCFA</td>
                </tr>
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </>
  );
}
