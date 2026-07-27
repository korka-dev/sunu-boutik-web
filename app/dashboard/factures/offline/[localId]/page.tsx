"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, LocalInvoice } from "@/lib/db";
import { useOnlineStatus } from "@/lib/use-online";

export default function OfflineInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const localId = Number(params.localId);
  const [invoice, setInvoice] = useState<LocalInvoice | null>(null);
  const { online, pendingCount } = useOnlineStatus();

  useEffect(() => {
    db.invoices.get(localId).then((inv) => {
      if (!inv) return;
      setInvoice(inv);
      // Si déjà synchronisée, rediriger vers la vraie page
      if (inv.serverId) {
        router.replace(`/dashboard/factures/${inv.serverId}`);
      }
    });
  }, [localId, router]);

  // Vérification périodique si la facture a été synchronisée
  useEffect(() => {
    const interval = setInterval(async () => {
      const inv = await db.invoices.get(localId);
      if (inv?.serverId) {
        router.replace(`/dashboard/factures/${inv.serverId}`);
      } else if (inv) {
        setInvoice(inv);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [localId, router]);

  if (!invoice) return <p className="p-6 text-gray-400">Chargement...</p>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Bannière hors connexion */}
      <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start gap-3">
        <span className="text-amber-500 text-xl">⚠</span>
        <div>
          <p className="font-semibold text-amber-800 text-sm">Facture sauvegardée hors connexion</p>
          <p className="text-amber-700 text-xs mt-0.5">
            {online
              ? `Synchronisation en cours… (${pendingCount} en attente)`
              : "Vous êtes hors connexion. La facture sera envoyée au serveur dès que vous serez connecté."}
          </p>
        </div>
      </div>

      {/* Détails facture */}
      <div className="bg-white rounded-xl shadow p-6 space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">N° Facture</p>
            <p className="font-bold text-lg">{invoice.number}</p>
            {invoice._tempNumber && (
              <p className="text-xs text-amber-600">Numéro temporaire — sera remplacé à la sync</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Date</p>
            <p className="text-sm">{new Date(invoice.created_at).toLocaleString("fr-FR")}</p>
          </div>
        </div>

        {invoice.client_name && (
          <div>
            <p className="text-xs text-gray-500">Client</p>
            <p className="font-medium">{invoice.client_name}</p>
          </div>
        )}

        {/* Lignes */}
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              <th className="px-3 py-2">Article</th>
              <th className="px-3 py-2 text-right">Qté</th>
              <th className="px-3 py-2 text-right">Prix U</th>
              <th className="px-3 py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lines.map((line, i) => (
              <tr key={i} className="border-t">
                <td className="px-3 py-2">{line.product_name}</td>
                <td className="px-3 py-2 text-right">{line.quantity}</td>
                <td className="px-3 py-2 text-right">{line.unit_price.toLocaleString()}</td>
                <td className="px-3 py-2 text-right font-medium">{line.line_total.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-300">
              <td colSpan={3} className="px-3 py-2 font-bold text-right">TOTAL</td>
              <td className="px-3 py-2 font-bold text-right text-blue-700">
                {invoice.total.toLocaleString()} FCFA
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => router.push("/dashboard/factures")}
          className="flex-1 border border-gray-300 rounded-lg py-2 text-sm font-medium hover:bg-gray-50"
        >
          ← Retour aux factures
        </button>
        <button
          onClick={() => window.print()}
          className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700"
        >
          Imprimer
        </button>
      </div>
    </div>
  );
}
