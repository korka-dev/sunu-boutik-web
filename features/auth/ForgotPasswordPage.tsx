"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { ApiError } from "@/lib/api";
import { checkPhoneForReset, resetPasswordByPhone } from "./auth.api";

type Step = "phone" | "reset" | "done";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [shopName, setShopName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onCheckPhone(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await checkPhoneForReset(phone.trim());
      setShopName(res.shop_name);
      setStep("reset");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur de connexion");
    } finally {
      setSubmitting(false);
    }
  }

  async function onReset(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    if (newPassword.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    setSubmitting(true);
    try {
      await resetPasswordByPhone(phone.trim(), newPassword);
      setStep("done");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur lors de la réinitialisation");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow p-8">
        <div className="flex justify-center mb-1">
          <Logo markClassName="w-9 h-9" className="text-2xl" />
        </div>
        <h1 className="text-center font-semibold text-lg mb-1">Mot de passe oublié</h1>

        {step === "phone" && (
          <>
            <p className="text-center text-gray-500 text-sm mb-6">
              Entrez le numéro de téléphone de votre boutique
            </p>
            <form onSubmit={onCheckPhone} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Numéro de téléphone
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ex: 771234567"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 text-white rounded-md py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? "Vérification..." : "Vérifier"}
              </button>
            </form>
          </>
        )}

        {step === "reset" && (
          <>
            <p className="text-center text-sm text-gray-500 mb-1">
              Compte trouvé : <span className="font-semibold text-gray-800">{shopName}</span>
            </p>
            <p className="text-center text-sm text-gray-500 mb-6">
              Choisissez un nouveau mot de passe
            </p>
            <form onSubmit={onReset} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 caractères"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmer le mot de passe
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Répétez le mot de passe"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 text-white rounded-md py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? "Enregistrement..." : "Réinitialiser le mot de passe"}
              </button>
              <button
                type="button"
                onClick={() => { setStep("phone"); setError(""); }}
                className="w-full text-sm text-gray-500 hover:underline"
              >
                ← Changer de numéro
              </button>
            </form>
          </>
        )}

        {step === "done" && (
          <div className="text-center space-y-4 mt-4">
            <div className="flex justify-center">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <p className="font-semibold text-gray-800">Mot de passe réinitialisé !</p>
            <p className="text-sm text-gray-500">Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p>
            <button
              onClick={() => router.push("/login")}
              className="w-full bg-blue-600 text-white rounded-md py-2 font-medium hover:bg-blue-700"
            >
              Se connecter
            </button>
          </div>
        )}

        {step !== "done" && (
          <p className="text-sm text-center text-gray-500 mt-6">
            <Link href="/login" className="text-blue-600 hover:underline">
              ← Retour à la connexion
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
