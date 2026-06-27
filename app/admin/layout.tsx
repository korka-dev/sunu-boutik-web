"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { adminApi, clearAdminToken, getAdminToken } from "@/lib/api";
import { IconChart, IconInbox, IconUsers } from "@/components/Icons";
import { LogoMark } from "@/components/Logo";

const navItems = [
  { href: "/admin", label: "Tableau de bord", Icon: IconChart },
  { href: "/admin/demandes", label: "Demandes", Icon: IconInbox },
  { href: "/admin/clients", label: "Mes Clients", Icon: IconUsers },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) {
      setChecked(true);
      return;
    }
    if (!getAdminToken()) {
      router.replace("/admin/login");
      return;
    }
    adminApi
      .get("/admin/overview")
      .then(() => setChecked(true))
      .catch(() => {
        clearAdminToken();
        router.replace("/admin/login");
      });
  }, [isLoginPage, router]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  function logout() {
    clearAdminToken();
    router.push("/admin/login");
  }

  if (isLoginPage) return <>{children}</>;

  if (!checked) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-gray-500">Chargement...</p>
      </div>
    );
  }

  const sidebarContent = (
    <>
      <div className="px-5 py-5 border-b border-gray-800 flex items-center gap-2">
        <LogoMark className="w-7 h-7" />
        <div>
          <p className="text-white font-bold">Sunu Boutik</p>
          <p className="text-xs text-gray-500">Administration</p>
        </div>
      </div>
      <nav className="flex-1 py-4 space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-5 py-2.5 text-sm font-medium ${
                active
                  ? "bg-gray-800 text-white border-r-2 border-blue-500"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <item.Icon />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-5 py-4 border-t border-gray-800">
        <button onClick={logout} className="text-sm text-gray-400 hover:text-white">
          Déconnexion
        </button>
      </div>
    </>
  );

  return (
    <div className="flex flex-1 flex-col md:flex-row min-h-0">
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-gray-900 text-white">
        <div className="flex items-center gap-2">
          <LogoMark className="w-6 h-6" />
          <span className="font-bold">Sunu Boutik</span>
        </div>
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Ouvrir le menu"
          className="p-2 text-gray-300 hover:text-white"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6">
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 max-w-[80vw] bg-gray-900 text-gray-300 flex flex-col shadow-xl">
            <div className="flex justify-end px-3 pt-3">
              <button onClick={() => setMenuOpen(false)} className="p-2 text-gray-400 hover:text-white">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
                  <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 bg-gray-900 text-gray-300 flex-col">
        {sidebarContent}
      </aside>

      <main className="flex-1 bg-gray-50 px-4 sm:px-6 md:px-8 py-6 md:py-8 overflow-y-auto overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
