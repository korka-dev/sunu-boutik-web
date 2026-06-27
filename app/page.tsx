"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Logo from "@/components/Logo";
import Modal from "@/components/Modal";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showAppModal, setShowAppModal] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (user) router.replace("/dashboard/articles");
  }, [loading, user, router]);

  if (loading || user) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-gray-500">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden">
      {/* Navbar */}
      <header className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex items-center justify-center">
        <Logo
          markClassName="animate-fade-in-up w-9 h-9 sm:w-10 sm:h-10"
          className="animate-fade-in-up text-lg sm:text-xl"
        />
      </header>

      {/* Hero */}
      <section className="px-4 sm:px-6 pt-4 sm:pt-6 pb-16 sm:pb-24 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="animate-fade-in-up delay-100 text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
            Gérez votre boutique,
            <br />
            <span className="text-blue-700">facturez en un instant</span>
          </h1>
          <p className="animate-fade-in-up delay-200 text-gray-500 mt-5 text-base sm:text-lg max-w-xl mx-auto px-2">
            Articles, stock, clients et factures : tout au même endroit, simple à utiliser,
            accessible depuis n&apos;importe quel appareil.
          </p>
          <div className="animate-fade-in-up delay-300 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mt-8 px-4 sm:px-0">
            <Link
              href="/register"
              className="w-full sm:w-auto bg-blue-600 text-white rounded-md px-6 py-3 font-medium hover:bg-blue-700"
            >
              Créer un compte
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto bg-white border border-gray-300 rounded-md px-6 py-3 font-medium text-gray-700 hover:bg-gray-50"
            >
              Se connecter
            </Link>
            <button
              type="button"
              onClick={() => setShowAppModal(true)}
              className="w-full sm:w-auto bg-white border border-gray-300 rounded-md px-6 py-3 font-medium text-gray-700 hover:bg-gray-50"
            >
              Télécharger l&apos;app
            </button>
          </div>

          <div className="animate-fade-in-up delay-400 animate-float mt-12 sm:mt-16 mx-auto max-w-md bg-white border border-gray-200 rounded-2xl shadow-sm p-4 sm:p-5 text-left">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 mb-3">
              <span className="font-semibold text-gray-800 text-sm sm:text-base break-all">
                Facture FA20260626-0001
              </span>
              <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 whitespace-nowrap">
                Payée
              </span>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between gap-2">
                <span>Riz 50kg × 2</span>
                <span>50 000 FCFA</span>
              </div>
              <div className="flex justify-between gap-2">
                <span>Huile 5L × 1</span>
                <span>8 500 FCFA</span>
              </div>
            </div>
            <div className="flex justify-between gap-2 border-t mt-3 pt-3 font-semibold text-gray-900">
              <span>Total</span>
              <span>58 500 FCFA</span>
            </div>
          </div>
        </div>
      </section>

      <footer className="text-center text-xs text-gray-400 pb-8 px-4">
        © {new Date().getFullYear()} Sunu Boutik — Sénégal
      </footer>

      {showAppModal && (
        <Modal title="Application mobile" onClose={() => setShowAppModal(false)}>
          <p className="text-sm text-gray-600">
            L&apos;application sera disponible bientôt. En attendant, vous pouvez utiliser Sunu Boutik
            directement depuis votre navigateur, y compris sur smartphone.
          </p>
        </Modal>
      )}
    </div>
  );
}
