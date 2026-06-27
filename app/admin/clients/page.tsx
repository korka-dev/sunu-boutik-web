"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import { adminApi, ApiError, ShopAdmin, ShopList, ShopStats } from "@/lib/api";

const PAGE_SIZE = 8;

export default function AdminClientsPage() {
  const [shops, setShops] = useState<ShopAdmin[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedShop, setSelectedShop] = useState<ShopAdmin | null>(null);
  const [stats, setStats] = useState<ShopStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(PAGE_SIZE),
        status_filter: "approved",
      });
      const list = await adminApi.get<ShopList>(`/admin/shops?${params.toString()}`);
      setShops(list.items);
      setTotalPages(list.total_pages);
      setTotal(list.total);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function openClient(shop: ShopAdmin) {
    setSelectedShop(shop);
    setStats(null);
    setStatsLoading(true);
    adminApi
      .get<ShopStats>(`/admin/shops/${shop.id}/stats`)
      .then(setStats)
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Mes Clients</h1>
      <p className="text-sm text-gray-500">Boutiques validées et actives sur la plateforme.</p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead className="bg-gray-50 text-gray-600 text-left">
            <tr>
              <th className="px-4 py-3">Boutique</th>
              <th className="px-4 py-3">Propriétaire</th>
              <th className="px-4 py-3">Client depuis</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-gray-400">Chargement...</td>
              </tr>
            )}
            {!loading && shops.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-gray-400">Aucun client validé</td>
              </tr>
            )}
            {shops.map((shop) => (
              <tr
                key={shop.id}
                onClick={() => openClient(shop)}
                className="border-t cursor-pointer hover:bg-gray-50"
              >
                <td className="px-4 py-3 font-medium text-blue-700">{shop.name}</td>
                <td className="px-4 py-3 text-gray-500">
                  {shop.owner_name}
                  <br />
                  <span className="text-xs">{shop.owner_email}</span>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {shop.reviewed_at ? new Date(shop.reviewed_at).toLocaleDateString("fr-FR") : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-gray-500">
            <span>
              {total} client{total > 1 ? "s" : ""} — page {page} / {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-md border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
              >
                Précédent
              </button>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-md border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedShop && (
        <Modal title={selectedShop.name} onClose={() => setSelectedShop(null)}>
          <div className="space-y-4">
            <div>
              <p className="font-medium text-gray-900">{selectedShop.owner_name}</p>
              <p className="text-sm text-gray-500">{selectedShop.owner_email}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500 mb-1">Adresse</p>
                <p className="text-gray-700">{selectedShop.address || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Téléphone</p>
                <p className="text-gray-700">{selectedShop.phone || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Client depuis</p>
                <p className="text-gray-700">
                  {selectedShop.reviewed_at
                    ? new Date(selectedShop.reviewed_at).toLocaleDateString("fr-FR")
                    : "—"}
                </p>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-xs text-gray-500 mb-2">Statistiques d&apos;utilisation</p>
              {statsLoading && <p className="text-sm text-gray-400">Chargement...</p>}
              {stats && (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Mini label="Articles créés" value={stats.products_count} />
                  <Mini label="Clients enregistrés" value={stats.clients_count} />
                  <Mini label="Factures émises" value={stats.invoices_count} />
                  <Mini label="Utilisateurs" value={stats.users_count} />
                  <Mini label="Chiffre d'affaires" value={`${stats.total_revenue.toLocaleString()} FCFA`} />
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-gray-50 rounded-md px-3 py-2">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-semibold text-gray-900">{value}</p>
    </div>
  );
}
