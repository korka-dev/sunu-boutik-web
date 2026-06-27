"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminApi, ApiError, Overview, ShopAdmin, ShopList } from "@/lib/api";

const statusLabels: Record<string, string> = {
  pending: "En attente",
  approved: "Validée",
  rejected: "Rejetée",
};

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

export default function AdminDashboardPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [recent, setRecent] = useState<ShopAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [ov, list] = await Promise.all([
          adminApi.get<Overview>("/admin/overview"),
          adminApi.get<ShopList>("/admin/shops?page=1&page_size=5"),
        ]);
        setOverview(ov);
        setRecent(list.items);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Tableau de bord</h1>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Boutiques" value={overview.total_shops} />
          <StatCard label="En attente" value={overview.pending_shops} highlight />
          <StatCard label="Validées" value={overview.approved_shops} />
          <StatCard label="Chiffre d'affaires global" value={`${overview.total_revenue.toLocaleString()} FCFA`} />
        </div>
      )}

      <div className="bg-white rounded-xl shadow">
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 border-b">
          <h2 className="font-semibold text-gray-900">Notifications — Demandes passées</h2>
          <Link href="/admin/demandes" className="text-sm text-blue-600 hover:underline">
            Voir toutes les demandes
          </Link>
        </div>

        {loading && <p className="px-5 py-6 text-gray-400 text-sm">Chargement...</p>}
        {!loading && recent.length === 0 && (
          <p className="px-5 py-6 text-gray-400 text-sm">Aucune demande pour le moment</p>
        )}

        <ul className="divide-y">
          {recent.map((shop) => (
            <li key={shop.id} className="px-5 py-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium text-gray-900">{shop.name}</p>
                <p className="text-sm text-gray-500">
                  {shop.owner_name} — {shop.owner_email}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Demande du {new Date(shop.created_at).toLocaleDateString("fr-FR")}
                  {shop.reviewed_at &&
                    ` · traitée le ${new Date(shop.reviewed_at).toLocaleDateString("fr-FR")}`}
                </p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${statusColors[shop.status]}`}>
                {statusLabels[shop.status]}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={`rounded-xl shadow p-4 ${highlight ? "bg-amber-50" : "bg-white"}`}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
