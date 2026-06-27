"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import { adminApi, ApiError, ShopAdmin, ShopList, ShopStats } from "@/lib/api";

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

const PAGE_SIZE = 8;

export default function AdminDemandesPage() {
  const [shops, setShops] = useState<ShopAdmin[]>([]);
  const [filter, setFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [managingShop, setManagingShop] = useState<ShopAdmin | null>(null);
  const [stats, setStats] = useState<ShopStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE) });
      if (filter) params.set("status_filter", filter);
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
  }, [filter, page]);

  function changeFilter(value: string) {
    setFilter(value);
    setPage(1);
  }

  function openManage(shop: ShopAdmin) {
    setManagingShop(shop);
    setStats(null);
    setRejectReason("");
    setActionError("");
    setStatsLoading(true);
    adminApi
      .get<ShopStats>(`/admin/shops/${shop.id}/stats`)
      .then(setStats)
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }

  function closeManage() {
    setManagingShop(null);
  }

  async function approve() {
    if (!managingShop) return;
    setActionLoading(true);
    setActionError("");
    try {
      await adminApi.post(`/admin/shops/${managingShop.id}/approve`);
      closeManage();
      await load();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Erreur lors de la validation");
    } finally {
      setActionLoading(false);
    }
  }

  async function reject() {
    if (!managingShop) return;
    setActionLoading(true);
    setActionError("");
    try {
      await adminApi.post(`/admin/shops/${managingShop.id}/reject`, { reason: rejectReason || null });
      closeManage();
      await load();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Erreur lors du rejet");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900">Demandes</h1>
        <select
          value={filter}
          onChange={(e) => changeFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">Toutes</option>
          <option value="pending">En attente</option>
          <option value="approved">Validées</option>
          <option value="rejected">Rejetées</option>
        </select>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-gray-50 text-gray-600 text-left">
            <tr>
              <th className="px-4 py-3">Boutique</th>
              <th className="px-4 py-3">Propriétaire</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Créée le</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-400">Chargement...</td>
              </tr>
            )}
            {!loading && shops.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-400">Aucune demande</td>
              </tr>
            )}
            {shops.map((shop) => (
              <tr key={shop.id} className="border-t">
                <td className="px-4 py-3 font-medium">{shop.name}</td>
                <td className="px-4 py-3 text-gray-500">
                  {shop.owner_name}
                  <br />
                  <span className="text-xs">{shop.owner_email}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[shop.status]}`}>
                    {statusLabels[shop.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(shop.created_at).toLocaleDateString("fr-FR")}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => openManage(shop)}
                    className="bg-gray-900 text-white rounded-md px-3 py-1.5 text-xs font-medium hover:bg-gray-800"
                  >
                    Gérer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-gray-500">
            <span>
              {total} demande{total > 1 ? "s" : ""} — page {page} / {totalPages}
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

      {managingShop && (
        <Modal title={`Gérer — ${managingShop.name}`} onClose={closeManage}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{managingShop.owner_name}</p>
                <p className="text-sm text-gray-500">{managingShop.owner_email}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[managingShop.status]}`}>
                {statusLabels[managingShop.status]}
              </span>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1">Adresse</p>
              <p className="text-sm text-gray-700">{managingShop.address || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Téléphone</p>
              <p className="text-sm text-gray-700">{managingShop.phone || "—"}</p>
            </div>

            <div className="border-t pt-4">
              <p className="text-xs text-gray-500 mb-2">Statistiques</p>
              {statsLoading && <p className="text-sm text-gray-400">Chargement...</p>}
              {stats && (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Mini label="Articles" value={stats.products_count} />
                  <Mini label="Clients" value={stats.clients_count} />
                  <Mini label="Factures" value={stats.invoices_count} />
                  <Mini label="CA" value={`${stats.total_revenue.toLocaleString()} FCFA`} />
                </div>
              )}
            </div>

            {actionError && <p className="text-sm text-red-600">{actionError}</p>}

            {managingShop.status === "pending" && (
              <div className="border-t pt-4 space-y-3">
                <input
                  placeholder="Motif du rejet (optionnel)"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
                <div className="flex gap-3">
                  <button
                    onClick={approve}
                    disabled={actionLoading}
                    className="flex-1 bg-green-600 text-white rounded-md py-2 text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                  >
                    Valider la demande
                  </button>
                  <button
                    onClick={reject}
                    disabled={actionLoading}
                    className="flex-1 bg-red-600 text-white rounded-md py-2 text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                  >
                    Rejeter
                  </button>
                </div>
              </div>
            )}
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
