import { Client, Invoice, Shop } from "@/lib/api";

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

type IconName = "shop" | "phone" | "pin" | "id" | "user" | "hash" | "calendar" | "clock";

function Icon({ name }: { name: IconName }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "inv-icon",
  };
  switch (name) {
    case "shop":
      return (
        <svg {...common}>
          <path d="M3 9l1.2-5h15.6L21 9M4.5 9V19.5h15V9M9.5 19.5v-6h5v6" />
        </svg>
      );
    case "phone":
      return (
        <svg {...common}>
          <path d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.2c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1l-2 2.2z" />
        </svg>
      );
    case "pin":
      return (
        <svg {...common}>
          <path d="M12 21s7-6.1 7-11a7 7 0 10-14 0c0 4.9 7 11 7 11z" />
          <circle cx="12" cy="10" r="2.2" />
        </svg>
      );
    case "id":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="1.5" />
          <circle cx="8" cy="11" r="1.8" />
          <path d="M13 10h5M13 13h5M6 17h4" />
        </svg>
      );
    case "user":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.2" />
          <path d="M5 20c0-4 3.5-6.5 7-6.5s7 2.5 7 6.5" />
        </svg>
      );
    case "hash":
      return (
        <svg {...common}>
          <path d="M9 3L7 21M17 3l-2 18M4 9h16M3 15h16" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="15" rx="1.5" />
          <path d="M3 10h18M8 3v4M16 3v4" />
        </svg>
      );
    case "clock":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3.5 2" />
        </svg>
      );
  }
}

function InvoiceHeader({
  shop,
  phones,
  clientLabel,
  clientAddress,
  invoiceNumber,
  dateStr,
  heureStr,
}: {
  shop: Shop;
  phones: string;
  clientLabel: string;
  clientAddress: string;
  invoiceNumber: string | number;
  dateStr: string;
  heureStr: string;
}) {
  return (
    <div className="inv-header">
      <div className="inv-header-cols">
        <div className="inv-header-col">
          <div className="inv-header-title"><Icon name="shop" />Informations boutique</div>
          <div className="inv-header-name">{shop.name}</div>
          {shop.address && <div className="inv-header-row"><Icon name="pin" />{shop.address}</div>}
          {phones && <div className="inv-header-row"><Icon name="phone" />{phones}</div>}
          {shop.rc && <div className="inv-header-row"><Icon name="id" />RC: {shop.rc}</div>}
          {shop.ninea && <div className="inv-header-row"><Icon name="id" />NINEA: {shop.ninea}</div>}
        </div>
        <div className="inv-header-col">
          <div className="inv-header-title"><Icon name="user" />Informations client</div>
          {clientLabel && <div className="inv-header-name">{clientLabel}</div>}
          {clientAddress && <div className="inv-header-row"><Icon name="pin" />{clientAddress}</div>}
        </div>
      </div>
      <div className="inv-header-meta">
        <span><Icon name="hash" />Facture N° {invoiceNumber}</span>
        <span><Icon name="calendar" />{dateStr}</span>
        <span><Icon name="clock" />{heureStr}</span>
      </div>
    </div>
  );
}

export default function InvoiceCopiesView({
  invoice,
  shop,
  client,
}: {
  invoice: Invoice;
  shop: Shop;
  client: Client | null;
}) {
  const dateObj = new Date(invoice.created_at);
  const dateStr = dateObj.toLocaleDateString("fr-FR");
  const heureStr = dateObj.toLocaleTimeString("fr-FR");
  // Même règle que le PDF Ticket/A4 (backend: invoices.py) : nom + téléphone du client lié,
  // sinon le nom libre saisi sur la facture.
  const clientLabel = client ? client.name + (client.phone ? ` - ${client.phone}` : "") : invoice.client_name || "";
  const clientAddress = client?.address || "";
  const totalQty = invoice.lines.reduce((s, l) => s + l.quantity, 0);
  const phones = [shop.phone, shop.phone2, shop.phone3].filter(Boolean).join(" - ");
  const amountWords = numberToWords(Math.round(invoice.total)) + " francs CFA";

  return (
    <div className="copies-preview">
      <style>{`
        .invoice-copies, .invoice-copies * { box-sizing: border-box; margin: 0; padding: 0; }
        .invoice-copies { font-family: Arial, Helvetica, sans-serif; font-size: 11px; }

        @media print {
          @page { size: A4 landscape; margin: 8mm; }
          .copies-preview { background: white !important; padding: 0 !important; }
        }

        .copies-preview { background: #e5e7eb; padding: 16px 0; }
        .invoice-copies.a4 {
          width: 297mm; margin: 0 auto; background: white;
          display: grid; grid-template-columns: 1fr 1fr;
        }
        .invoice-copies .copy { padding: 8mm 10mm; border-right: 2px dashed #999; }
        .invoice-copies .copy:last-child { border-right: none; }

        /* Copy label banner */
        .invoice-copies .copy-banner {
          display: flex; justify-content: space-between; align-items: center;
          background: #111; color: white;
          padding: 3px 8px; margin-bottom: 6px;
          font-size: 9px; letter-spacing: 1px; font-weight: bold;
        }

        /* Header — deux colonnes (boutique / client), bordure globale, sans petits cadres */
        .invoice-copies .inv-header { border: 1.3px solid #222; margin-bottom: 8px; }
        .invoice-copies .inv-header-cols { display: grid; grid-template-columns: 1fr 1fr; }
        .invoice-copies .inv-header-col { padding: 6px 9px; }
        .invoice-copies .inv-header-col + .inv-header-col { border-left: 1px solid #222; }
        .invoice-copies .inv-header-title {
          display: flex; align-items: center; gap: 4px;
          font-size: 8.5px; font-weight: bold; letter-spacing: 0.4px; text-transform: uppercase;
          color: #333; border-bottom: 1px solid #ddd; padding-bottom: 3px; margin-bottom: 4px;
        }
        .invoice-copies .inv-header-name { font-size: 12px; font-weight: bold; text-transform: uppercase; line-height: 1.25; }
        .invoice-copies .inv-header-row {
          display: flex; align-items: center; gap: 5px;
          font-size: 9px; color: #333; line-height: 1.5; margin-top: 2px;
        }
        .invoice-copies .inv-header-meta {
          display: flex; justify-content: space-between; align-items: center;
          border-top: 1px solid #222; padding: 4px 9px;
          background: #f4f4f4; font-size: 9.5px; font-weight: bold;
        }
        .invoice-copies .inv-header-meta span { display: flex; align-items: center; gap: 4px; }
        .invoice-copies .inv-icon { width: 10px; height: 10px; flex-shrink: 0; color: #666; }
        .invoice-copies .inv-header-title .inv-icon { width: 11px; height: 11px; color: #333; }

        /* Table */
        .invoice-copies table { width: 100%; border-collapse: collapse; font-size: 10px; }
        .invoice-copies thead tr { background: #111; color: white; }
        .invoice-copies th { padding: 4px 5px; text-align: left; font-weight: bold; border: 1px solid #555; }
        .invoice-copies th.right, .invoice-copies td.right { text-align: right; }
        .invoice-copies td { padding: 3px 5px; border: 1px solid #ddd; vertical-align: top; }
        .invoice-copies tr:nth-child(even) td { background: #f9f9f9; }

        /* Footer */
        .invoice-copies .footer-totals { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; border: 1px solid #333; margin-top: 6px; }
        .invoice-copies .ft-cell { padding: 4px 6px; border-right: 1px solid #333; font-size: 9px; }
        .invoice-copies .ft-cell:last-child { border-right: none; }
        .invoice-copies .ft-label { font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 2px; margin-bottom: 2px; text-align: center; }
        .invoice-copies .ft-value { font-size: 11px; font-weight: bold; text-align: center; }

        .invoice-copies .signatures { display: grid; grid-template-columns: 1fr 1fr 1fr; border: 1px solid #333; border-top: none; }
        .invoice-copies .sig-cell { padding: 3px 6px; border-right: 1px solid #333; min-height: 36px; }
        .invoice-copies .sig-cell:last-child { border-right: none; }
        .invoice-copies .sig-label { font-size: 8px; font-weight: bold; text-align: center; border-bottom: 1px solid #ddd; padding-bottom: 2px; margin-bottom: 4px; }

        .invoice-copies .bottom-text { margin-top: 5px; font-size: 8.5px; }
        .invoice-copies .bottom-ref { display: flex; justify-content: space-between; margin-top: 2px; font-size: 8px; color: #555; }
      `}</style>

      <div className="invoice-copies a4">
        {COPIES.map((copy, ci) => (
          <div key={ci} className="copy">
            <div className="copy-banner">
              <span>{copy.label}</span>
              <span style={{ fontWeight: "normal", letterSpacing: 0 }}>{copy.sub}</span>
            </div>

            {/* Header — 2 colonnes (boutique / client), réutilisable pour Ticket/A4 */}
            <InvoiceHeader
              shop={shop}
              phones={phones}
              clientLabel={clientLabel}
              clientAddress={clientAddress}
              invoiceNumber={invoice.number}
              dateStr={dateStr}
              heureStr={heureStr}
            />

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
            
            <div className="bottom-text">
              <em>Merci pour votre confiance !</em>
            </div>
            <div className="bottom-text" style={{ textAlign: "center", marginTop: "4px" }}>
              <em>www.sunu-boutik.com</em>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
