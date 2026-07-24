"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, ApiError, Invoice, Shop } from "@/lib/api";

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
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.get<Invoice>(`/invoices/${invoiceId}`),
      api.get<{ user: { full_name: string }; shop: Shop | null }>("/auth/me"),
    ])
      .then(([inv, me]) => { setInvoice(inv); setShop(me.shop); })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Erreur"));
  }, [invoiceId]);

  if (error) return <p className="p-6 text-red-600">{error}</p>;
  if (!invoice || !shop) return <p className="p-6 text-gray-400">Chargement...</p>;

  const dateObj = new Date(invoice.created_at);
  const dateStr = dateObj.toLocaleDateString("fr-FR");
  const heureStr = dateObj.toLocaleTimeString("fr-FR");
  const clientLabel = invoice.client_name || "";
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
        }
        .a4 { width: 210mm; margin: 0 auto; background: white; }
        .copy { padding: 8mm 10mm; border-bottom: 2px dashed #999; }
        .copy:last-child { border-bottom: none; }

        /* Copy label banner */
        .copy-banner {
          display: flex; justify-content: space-between; align-items: center;
          background: #111; color: white;
          padding: 3px 8px; margin-bottom: 6px;
          font-size: 9px; letter-spacing: 1px; font-weight: bold;
        }

        /* Header */
        .header { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 8px; border: 1px solid #333; }
        .header-left { padding: 6px 8px; border-right: 1px solid #333; }
        .header-right { padding: 6px 8px; }
        .shop-name { font-size: 13px; font-weight: bold; text-transform: uppercase; line-height: 1.2; }
        .shop-sub { font-size: 9px; color: #444; margin-bottom: 4px; }
        .shop-meta { font-size: 9px; line-height: 1.6; }
        .phones { font-size: 9px; font-weight: bold; margin-top: 2px; }
        .inv-row { display: flex; gap: 6px; font-size: 10px; margin-bottom: 3px; }
        .inv-label { font-weight: bold; min-width: 50px; }
        .inv-box { border: 1px solid #333; padding: 2px 4px; flex: 1; min-height: 18px; font-size: 10px; font-weight: bold; }

        /* Table */
        table { width: 100%; border-collapse: collapse; font-size: 10px; }
        thead tr { background: #111; color: white; }
        th { padding: 4px 5px; text-align: left; font-weight: bold; border: 1px solid #555; }
        th.right, td.right { text-align: right; }
        td { padding: 3px 5px; border: 1px solid #ddd; vertical-align: top; }
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
                <div className="inv-row">
                  <span className="inv-label">DATE :</span>
                  <span className="inv-box">{dateStr}</span>
                  <span className="inv-label" style={{ minWidth: 40 }}>HEURE</span>
                  <span className="inv-box">{heureStr}</span>
                </div>
                <div className="inv-row">
                  <span className="inv-label">N° Facture :</span>
                  <span className="inv-box">{invoice.number}</span>
                </div>
                <div className="inv-row">
                  <span className="inv-label">Client :</span>
                  <span className="inv-box">{clientLabel}</span>
                </div>
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
              <span>{invoice.number}</span>
              <span style={{ fontWeight: "bold", letterSpacing: "1px" }}>FACTURE COMPTANT</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
