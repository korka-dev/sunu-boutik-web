"use client";

import { useRouter } from "next/navigation";
import InvoiceForm from "@/components/InvoiceForm";
import { Invoice } from "@/lib/api";

export default function NewFacturePage() {
  const router = useRouter();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">Nouvelle facture</h2>
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:underline">
          ← Retour
        </button>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <InvoiceForm onSaved={(invoice: Invoice) => router.push(`/dashboard/factures/${invoice.id}`)} />
      </div>
    </div>
  );
}
