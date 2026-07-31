"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { OfflineProvider } from "@/lib/offline-context";
import OfflineIndicator from "@/components/OfflineIndicator";
import { IconBox, IconCash, IconReceipt, IconTag, IconUsers, IconUser } from "@/components/Icons";

function IconPlus({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function IconSwap({ className = "w-[18px] h-[18px]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 8h13M17 8l-3.5-3.5M17 8l-3.5 3.5" />
      <path d="M20 16H7M7 16l3.5-3.5M7 16l3.5 3.5" />
    </svg>
  );
}

const navItems = [
  { href: "/dashboard/categories", label: "Catégories", Icon: IconTag },
  { href: "/dashboard/articles", label: "Articles", Icon: IconBox },
  { href: "/dashboard/transformations", label: "Transformations", Icon: IconSwap },
  { href: "/dashboard/clients", label: "Clients", Icon: IconUsers },
  { href: "/dashboard/factures", label: "Factures", Icon: IconReceipt },
  { href: "/dashboard/caisse", label: "Caisse", Icon: IconCash },
  { href: "/dashboard/profil", label: "Profil", Icon: IconUser },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, shop, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.must_change_password) {
      router.replace("/change-password");
    }
  }, [loading, user, router]);

  if (loading || !user || user.must_change_password) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-gray-500">Chargement...</p>
      </div>
    );
  }

  return (
    <OfflineProvider>
    <OfflineIndicator />
    <div className="flex flex-1 flex-col md:flex-row min-h-0">
      {/* Mobile top bar */}
      <div className="md:hidden no-print flex items-center justify-between px-4 py-3 bg-white border-b">
        <div>
          <p className="font-bold text-blue-700">{shop?.name}</p>
          <p className="text-xs text-gray-500">{user.full_name}</p>
        </div>
        <button onClick={logout} className="text-xs text-gray-500 hover:text-red-600">
          Déconnexion
        </button>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 bg-white border-r flex-col no-print">
        <div className="px-5 py-5 border-b">
          <p className="font-bold text-blue-700">{shop?.name}</p>
          <p className="text-xs text-gray-500">{user.full_name}</p>
        </div>
        {pathname !== "/dashboard/factures/new" && (
          <div className="px-5 pt-4">
            <Link
              href="/dashboard/factures/new"
              className="flex items-center justify-center gap-1.5 bg-blue-600 text-white rounded-md px-3 py-2.5 text-sm font-medium hover:bg-blue-700"
            >
              <IconPlus className="w-4 h-4" />
              Nouvelle facture
            </Link>
          </div>
        )}
        <nav className="flex-1 py-4 space-y-1">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-5 py-2.5 text-sm font-medium ${
                  active
                    ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <item.Icon />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-5 py-4 border-t">
          <button onClick={logout} className="text-sm text-gray-500 hover:text-red-600">
            Déconnexion
          </button>
        </div>
      </aside>

      <main className="flex-1 bg-gray-50 px-4 sm:px-6 md:px-8 py-6 md:py-8 pb-24 md:pb-8 overflow-y-auto overflow-x-hidden print:p-0 print:overflow-visible print:bg-white">
        {children}
      </main>

      {/* Mobile quick action: nouvelle facture accessible depuis n'importe quelle page */}
      {pathname !== "/dashboard/factures/new" && (
        <Link
          href="/dashboard/factures/new"
          aria-label="Nouvelle facture"
          className="md:hidden no-print fixed right-4 z-30 bg-blue-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-blue-700"
          style={{ bottom: "calc(64px + env(safe-area-inset-bottom) + 12px)" }}
        >
          <IconPlus className="w-6 h-6" />
        </Link>
      )}

      {/* Mobile bottom app nav */}
      <nav className="md:hidden no-print fixed bottom-0 left-0 right-0 z-30 bg-white border-t flex items-stretch pb-[env(safe-area-inset-bottom)]">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium ${
                active ? "text-blue-700" : "text-gray-500"
              }`}
            >
              <item.Icon className={active ? "w-6 h-6" : "w-6 h-6 opacity-70"} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
    </OfflineProvider>
  );
}
