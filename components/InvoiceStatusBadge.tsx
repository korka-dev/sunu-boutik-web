import { InvoiceStatus } from "@/lib/api";

export const STATUS_LABELS: Record<InvoiceStatus, string> = {
  unpaid: "Non payée",
  partial: "Partiellement payée",
  paid: "Payée",
};

const STATUS_COLORS: Record<InvoiceStatus, string> = {
  unpaid: "bg-red-100 text-red-700",
  partial: "bg-amber-100 text-amber-800",
  paid: "bg-green-100 text-green-800",
};

export default function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_COLORS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
