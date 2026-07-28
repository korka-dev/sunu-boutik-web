"use client";

import { useEffect, useState } from "react";
import SkeletonRows from "@/components/SkeletonRows";
import { api, ApiError, Payment } from "@/lib/api";

export default function PaymentHistory({
  invoiceId,
  currentUser,
  refreshKey,
  onVoided,
}: {
  invoiceId: number;
  currentUser: { id: number; full_name: string } | null;
  refreshKey?: unknown;
  onVoided?: () => void;
}) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [voidingId, setVoidingId] = useState<number | null>(null);
  const [voidError, setVoidError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    api
      .get<Payment[]>(`/invoices/${invoiceId}/payments`)
      .then(setPayments)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Erreur de chargement"))
      .finally(() => setLoading(false));
  }, [invoiceId, refreshKey]);

  function payerName(payment: Payment): string {
    if (currentUser && payment.created_by_id === currentUser.id) return currentUser.full_name;
    return "—";
  }

  async function onVoid(payment: Payment) {
    const reason = prompt(
      `Annuler ce paiement de ${payment.amount.toLocaleString()} FCFA — motif de l'annulation :`
    );
    if (reason === null) return;
    if (!reason.trim()) {
      setVoidError("Le motif d'annulation est requis");
      return;
    }
    setVoidError("");
    setVoidingId(payment.id);
    try {
      await api.post(`/invoices/${invoiceId}/payments/${payment.id}/void`, { reason: reason.trim() });
      onVoided?.();
    } catch (err) {
      setVoidError(err instanceof ApiError ? err.message : "Erreur lors de l'annulation");
    } finally {
      setVoidingId(null);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow overflow-x-auto no-print">
      <h3 className="px-4 sm:px-5 pt-4 font-semibold text-sm text-gray-700">Historique des paiements</h3>
      {voidError && <p className="px-4 sm:px-5 pt-2 text-sm text-red-600">{voidError}</p>}

      <table className="w-full min-w-[420px] text-sm mt-2">
        <thead className="bg-gray-50 text-gray-600 text-left">
          <tr>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3 text-right">Montant</th>
            <th className="px-4 py-3">Utilisateur</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading && <SkeletonRows cols={4} />}
          {!loading && error && (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-red-600">
                {error}
              </td>
            </tr>
          )}
          {!loading && !error && payments.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                Aucun paiement enregistré
              </td>
            </tr>
          )}
          {!loading &&
            !error &&
            payments.map((payment) => (
              <tr key={payment.id} className={`border-t ${payment.is_voided ? "opacity-50" : ""}`}>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(payment.created_at).toLocaleDateString("fr-FR")}
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  {payment.amount.toLocaleString()} FCFA
                </td>
                <td className="px-4 py-3">
                  {payerName(payment)}
                  {payment.is_voided && (
                    <span className="ml-2 text-xs text-red-600 font-medium">
                      Annulé{payment.void_reason ? ` — ${payment.void_reason}` : ""}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {!payment.is_voided && (
                    <button
                      onClick={() => onVoid(payment)}
                      disabled={voidingId === payment.id}
                      className="text-red-600 hover:underline disabled:opacity-50"
                    >
                      {voidingId === payment.id ? "Annulation..." : "Annuler"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
