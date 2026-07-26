"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, ApiError, Client, Invoice, Shop } from "@/lib/api";

function numberToWords(n: number): string {
  const units = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf",
    "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
  const tens = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante", "quatre-vingt", "quatre-vingt"];
  if (n === 0) return "zéro";
  if (n < 0) return "moins " + numberToWords(-n);
  let result = "";
  if (n >= 1000000) { result += numberToWords(Math.floor(n / 1000000)) + " million "; n %= 1000000; }
  if (n >= 1000) { result += numberToWords(Math.floor(n / 1000)) + " mille "; n %= 1000; }
  if (n >= 100) { result += units[Math.floor(n / 100)] + " cent "; n %= 100; }
  if (n >= 20) {
    const t = Math.floor(n / 10);
    const u = n % 10;
    if (t === 7 || t === 9) result += tens[t] + (u === 1 && t === 7 ? "-et-" : "-") + units[10 + u] + " ";
    else result += tens[t] + (u > 0 ? "-" + units[u] : "") + " ";
  } else if (n > 0) result += units[n] + " ";
  return result.trim();
}

const COPIES: { label: string; sub: string }[] = [
  { label: "CLIENT", sub: "À remettre au client" },
  { label: "PROPRIÉTAIRE", sub: "À conserver par la boutique" },
];

export default function PrintFacturePage() {
  const params = useParams();
  const invoiceId = Number(params.id);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.get<Invoice>(`/invoices/${invoiceId}`),
      api.get<{ user: { full_name: string }; shop: Shop | null }>("/auth/me"),
    ])
      .then(([inv, me]) => {
        setInvoice(inv);
        setShop(me.shop);
        if (inv.client_id) {
          api.get<Client>(`/clients/${inv.client_id}`).then(setClient).catch(() => {});
        }
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Erreur"));
  }, [invoiceId]);

  if (error) return <p className="p-6 text-red-600">{error}</p>;
  if (!invoice || !shop) return <p className="p-6 text-gray-400">Chargement...</p>;

  const dateObj = new Date(invoice.created_at);
  const dateStr = dateObj.toLocaleDateString("fr-FR");
  const heureStr = dateObj.toLocaleTimeString("fr-FR");
  const clientLabel = client?.name || invoice.client_name || "";
  const clientPhone = client?.phone || "";
  const clientAddress = client?.address || "";
  const totalQty = invoice.lines.reduce((s, l) => s + l.quantity, 0);
  const phones = [shop.phone, shop.phone2, shop.phone3].filter(Boolean).join(" - ");
  const amountWords = numberToWords(Math.round(invoice.total)) + " francs CFA";

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; background: #e5e7eb; }
        @media print {
          body { background: white; }
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
          @page { size: A4 landscape; margin: 8mm; }
          .a4 { width: 100%; }
        }
        .a4 { width: 297mm; margin: 0 auto; background: white; display: flex; }
        .copy { flex: 0 0 50%; width: 50%; padding: 8mm 10mm; border-right: 2px dashed #999; }
        .copy:last-child { border-right: none; }

        /* Copy label banner */
        .copy-banner {
          display: flex; justify-content: space-between; align-items: center;
          background: #111; color: white;
          padding: 3px 8px; margin-bottom: 6px;
          font-size: 9px; letter-spacing: 1px; font-weight: bold;
        }

        /* Header */
        .header { display: grid; grid-template-columns: 1.1fr 1fr; margin-bottom: 8px; border: 1px solid #333; }
        .header-left { padding: 8px 10px; border-right: 1px solid #333; display: flex; flex-direction: column; justify-content: center; gap: 2px; }
        .header-right { padding: 8px 10px; display: flex; flex-direction: column; justify-content: center; }
        .shop-name { font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.3px; line-height: 1.2; }
        .shop-sub { font-size: 9px; color: #555; }
        .shop-meta { font-size: 9px; color: #555; }
        .phones { font-size: 9.5px; font-weight: bold; margin-top: 2px; }
        .info-line { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; padding: 2.5px 0; border-bottom: 1px dotted #ccc; }
        .info-line:last-child { border-bottom: none; }
        .info-label { font-size: 8.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; color: #666; white-space: nowrap; }
        .info-value { font-size: 11px; font-weight: bold; text-align: right; }

        /* Table */
        table { width: 100%; border-collapse: collapse; font-size: 11.5px; }
        thead tr { background: #111; color: white; }
        th { padding: 6px 7px; text-align: left; font-weight: bold; border: 1px solid #555; font-size: 10.5px; }
        th.right, td.right { text-align: right; }
        td { padding: 6px 7px; border: 1px solid #ddd; vertical-align: middle; line-height: 1.35; }
        tr:nth-child(even) td { background: #f9f9f9; }

        /* Footer */
        .footer-totals { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; border: 1px solid #333; margin-top: 6px; }
        .ft-cell { padding: 4px 6px; border-right: 1px solid #333; font-size: 9px; }
        .ft-cell:last-child { border-right: none; }
        .ft-label { font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 2px; margin-bottom: 2px; text-align: center; }
        .ft-value { font-size: 11px; font-weight: bold; text-align: center; }

        .signatures { display: grid; grid-template-columns: 1fr 1fr 1fr; border: 1px solid #333; border-top: none; }
        .sig-cell { padding: 3px 6px; border-right: 1px solid #333; min-height: 36px; }
        .sig-cell:last-child { border-right: none; }
        .sig-label { font-size: 8px; font-weight: bold; text-align: center; border-bottom: 1px solid #ddd; padding-bottom: 2px; margin-bottom: 4px; }

        .bottom-text { margin-top: 5px; font-size: 8.5px; }
        .bottom-ref { display: flex; justify-content: space-between; margin-top: 2px; font-size: 8px; color: #555; }
      `}</style>

      <div className="no-print" style={{ padding: "12px 16px", display: "flex", gap: "10px", justifyContent: "flex-end", background: "#f3f4f6" }}>
        <button onClick={() => window.history.back()}
          style={{ border: "1px solid #d1d5db", borderRadius: "6px", padding: "6px 14px", fontSize: "13px", cursor: "pointer", background: "white" }}>
          ← Retour
        </button>
        <button onClick={() => window.print()}
          style={{ background: "#2563eb", color: "white", borderRadius: "6px", padding: "6px 14px", fontSize: "13px", fontWeight: "bold", cursor: "pointer", border: "none" }}>
          Imprimer (2 exemplaires)
        </button>
      </div>

      <div className="a4">
        {COPIES.map((copy, ci) => (
          <div key={ci} className="copy">
            <div className="copy-banner">
              <span>{copy.label}</span>
              <span style={{ fontWeight: "normal", letterSpacing: 0 }}>{copy.sub}</span>
            </div>

            {/* Header */}
            <div className="header">
              <div className="header-left">
                <div className="shop-name">{shop.name}</div>
                {shop.address && <div className="shop-sub">{shop.address}</div>}
                <div className="shop-meta">
                  {shop.rc && <div>RC: {shop.rc}</div>}
                  {shop.ninea && <div>NINEA: {shop.ninea}</div>}
                </div>
                {phones && <div className="phones">{phones}</div>}
              </div>
              <div className="header-right">
                <div className="info-line">
                  <span className="info-label">Date</span>
                  <span className="info-value">{dateStr} à {heureStr}</span>
                </div>
                <div className="info-line">
                  <span className="info-label">N° Facture</span>
                  <span className="info-value">{invoice.number}</span>
                </div>
                <div className="info-line">
                  <span className="info-label">Client</span>
                  <span className="info-value">{clientLabel}</span>
                </div>
                {clientPhone && (
                  <div className="info-line">
                    <span className="info-label">Téléphone</span>
                    <span className="info-value">{clientPhone}</span>
                  </div>
                )}
                {clientAddress && (
                  <div className="info-line">
                    <span className="info-label">Adresse</span>
                    <span className="info-value">{clientAddress}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Table */}
            <table>
              <thead>
                <tr>
                  <th style={{ width: "8%" }}>Qté</th>
                  <th style={{ width: "52%" }}>Désignation</th>
                  <th className="right" style={{ width: "20%" }}>Px unitaire</th>
                  <th className="right" style={{ width: "20%" }}>Montant TTC</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lines.map((line, i) => (
                  <tr key={i}>
                    <td className="right">{line.quantity % 1 === 0 ? Math.floor(line.quantity) : line.quantity}</td>
                    <td>{line.product_name}</td>
                    <td className="right">{line.unit_price.toLocaleString("fr-FR")}</td>
                    <td className="right">{line.line_total.toLocaleString("fr-FR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totaux */}
            <div className="footer-totals">
              <div className="ft-cell">
                <div className="ft-label">Total Articles</div>
                <div className="ft-value">{totalQty % 1 === 0 ? Math.floor(totalQty) : totalQty}</div>
              </div>
              <div className="ft-cell">
                <div className="ft-label">TOTAL</div>
                <div className="ft-value">{invoice.total.toLocaleString("fr-FR")}</div>
              </div>
              <div className="ft-cell">
                <div className="ft-label">ACOMPTE</div>
                <div className="ft-value">0</div>
              </div>
              <div className="ft-cell">
                <div className="ft-label">NET À PAYER</div>
                <div className="ft-value">{invoice.total.toLocaleString("fr-FR")}</div>
              </div>
            </div>

            {/* Signatures */}
            <div className="signatures">
              <div className="sig-cell"><div className="sig-label">VISA RESPONSABLE DÉPÔT</div></div>
              <div className="sig-cell"><div className="sig-label">VISA LIVREUR</div></div>
              <div className="sig-cell"><div className="sig-label">VISA CAISSIER</div></div>
            </div>

            {/* Bas de page */}
            <div className="bottom-text">
              Arrêtée la présente facture à la somme de : <em>{amountWords}</em>
            </div>
            <div className="bottom-ref">
              <span>SUNU BOUTIK</span>
              
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
