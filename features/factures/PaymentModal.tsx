"use client";

import { FormEvent, useState } from "react";
import Modal from "@/components/Modal";
import { ApiError } from "@/lib/api";
import { createPayment } from "./factures.api";
import { Invoice } from "./factures.types";

export default function PaymentModal({
  invoice,
  onClose,
  onSuccess,
}: {
  invoice: Invoice;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState(String(invoice.balance_due));
  const [amountReceived, setAmountReceived] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  // Générée une seule fois à l'ouverture du modal et réutilisée à chaque
  // tentative : si la requête est renvoyée (double clic, retry réseau), le
  // backend reconnaît la clé et renvoie le paiement déjà créé au lieu d'en
  // créer un doublon.
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  const amountNum = Number(amount);
  const amountReceivedNum = amountReceived.trim() ? Number(amountReceived) : null;
  const change =
    amountReceivedNum !== null && amountReceivedNum >= amountNum ? amountReceivedNum - amountNum : null;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!amountNum || amountNum <= 0) {
      setError("Le montant doit être positif");
      return;
    }
    if (amountNum > invoice.balance_due + 0.01) {
      setError(`Le montant dépasse le reste à payer (${invoice.balance_due.toLocaleString()} FCFA)`);
      return;
    }
    if (amountReceivedNum !== null && amountReceivedNum < amountNum) {
      setError("Le montant reçu ne peut pas être inférieur au montant encaissé");
      return;
    }

    setSubmitting(true);
    try {
      await createPayment(invoice.id, {
        amount: amountNum,
        amount_received: amountReceivedNum,
        note: note.trim() || null,
        idempotency_key: idempotencyKey,
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur lors de l'encaissement");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title={`Encaisser — Facture ${invoice.number}`} onClose={onClose}>
      <div className="mb-4 space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Total facture</span>
          <span className="font-medium">{invoice.total.toLocaleString()} FCFA</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Déjà payé</span>
          <span className="font-medium">{invoice.amount_paid.toLocaleString()} FCFA</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Reste à payer</span>
          <span className="font-semibold text-blue-700">{invoice.balance_due.toLocaleString()} FCFA</span>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Montant encaissé (FCFA)</label>
          <input
            type="number"
            min={0}
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Montant reçu du client <span className="text-gray-400">(optionnel, pour calculer le rendu)</span>
          </label>
          <input
            type="number"
            min={0}
            step="1"
            value={amountReceived}
            onChange={(e) => setAmountReceived(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2"
          />
          {change !== null && (
            <p className="mt-1 text-xs text-gray-500">
              Rendu monnaie : <span className="font-medium">{change.toLocaleString()} FCFA</span>
            </p>
          )}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Note <span className="text-gray-400">(optionnel)</span>
          </label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-blue-600 text-white rounded-md py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Enregistrement..." : "Encaisser"}
          </button>
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-500 hover:text-gray-800">
            Annuler
          </button>
        </div>
      </form>
    </Modal>
  );
}
