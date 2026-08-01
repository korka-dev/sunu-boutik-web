"use client";

import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";
import { updateShopProfile } from "./profil.api";

export default function ProfilPage() {
  const { user, shop, refreshMe } = useAuth();

  const [form, setForm] = useState({
    name: "", address: "", phone: "", phone2: "", phone3: "", ninea: "", rc: "",
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (shop) {
      setForm({
        name: shop.name || "",
        address: shop.address || "",
        phone: shop.phone || "",
        phone2: shop.phone2 || "",
        phone3: shop.phone3 || "",
        ninea: shop.ninea || "",
        rc: shop.rc || "",
      });
    }
  }, [shop]);

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
      setSuccess(false);
    };
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(""); setSuccess(false); setSaving(true);
    try {
      await updateShopProfile({
        name: form.name.trim() || undefined,
        address: form.address.trim() || undefined,
        phone: form.phone.trim() || undefined,
        phone2: form.phone2.trim() || undefined,
        phone3: form.phone3.trim() || undefined,
        ninea: form.ninea.trim() || undefined,
        rc: form.rc.trim() || undefined,
      });
      await refreshMe();
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="font-semibold text-lg">Mon profil</h2>

      {/* Infos utilisateur */}
      <div className="bg-white rounded-xl shadow p-6 space-y-3">
        <h3 className="font-medium text-gray-700 border-b pb-2">Informations personnelles</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Nom complet</p>
            <p className="font-medium">{user?.full_name}</p>
          </div>
          <div>
            <p className="text-gray-500">Email</p>
            <p className="font-medium">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Infos boutique */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="font-medium text-gray-700 border-b pb-2 mb-4">Informations de la boutique</h3>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la boutique</label>
            <input
              required
              value={form.name}
              onChange={update("name")}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
            <input
              value={form.address}
              onChange={update("address")}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone 1</label>
              <input value={form.phone} onChange={update("phone")} placeholder="77 XXX XX XX"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone 2</label>
              <input value={form.phone2} onChange={update("phone2")} placeholder="78 XXX XX XX"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone 3</label>
              <input value={form.phone3} onChange={update("phone3")} placeholder="76 XXX XX XX"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">NINEA</label>
              <input value={form.ninea} onChange={update("ninea")} placeholder="005550539"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">RC</label>
              <input value={form.rc} onChange={update("rc")} placeholder="SN-DKR-2015.A.11862"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">Profil mis à jour avec succès.</p>}

          <div className="flex justify-end">
            <button type="submit" disabled={saving}
              className="bg-blue-600 text-white rounded-md px-5 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
