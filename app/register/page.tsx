"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";
import Logo from "@/components/Logo";

export default function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm] = useState({
    shop_name: "",
    shop_address: "",
    shop_phone: "",
    full_name: "",
    email: "",
  });
  const [logo, setLogo] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const message = await register({ ...form, logo });
      setSuccessMessage(message);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur lors de l'inscription");
    } finally {
      setSubmitting(false);
    }
  }

  if (successMessage) {
    return (
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow p-8 text-center">
          <h1 className="text-2xl font-bold text-blue-700 mb-3">Demande envoyée</h1>
          <p className="text-gray-600">{successMessage}</p>
          <p className="text-gray-500 text-sm mt-4">
            Vous recevrez vos identifiants de connexion par email une fois votre demande validée.
            Vous ne pourrez pas vous connecter avant cette validation.
          </p>
          <Link href="/login" className="inline-block mt-6 text-blue-600 font-medium">
            Retour à la connexion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-xl shadow p-8">
        <Link href="/" className="flex justify-center mb-3">
          <Logo markClassName="w-9 h-9" className="text-lg" />
        </Link>
        <h1 className="text-2xl font-bold text-center text-blue-700 mb-1">Créer ma boutique</h1>
        <p className="text-center text-gray-500 mb-6">Démarrez en quelques secondes</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la boutique</label>
            <input
              required
              value={form.shop_name}
              onChange={update("shop_name")}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
              <input
                value={form.shop_address}
                onChange={update("shop_address")}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
              <input
                value={form.shop_phone}
                onChange={update("shop_phone")}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Votre nom complet</label>
            <input
              id="full_name"
              required
              value={form.full_name}
              onChange={update("full_name")}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={update("email")}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Logo de la boutique <span className="text-gray-400">(optionnel)</span>
            </label>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => setLogo(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-gray-600 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">Il apparaîtra sur vos factures. PNG, JPG ou WEBP, 2 Mo max.</p>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 text-white rounded-md py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Création..." : "Créer ma boutique"}
          </button>
        </form>

        <p className="text-sm text-center text-gray-500 mt-6">
          Déjà inscrit ?{" "}
          <Link href="/login" className="text-blue-600 font-medium">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
