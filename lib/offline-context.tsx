"use client";

import { createContext, useContext, useEffect, useRef } from "react";
import { refreshLocalCache, processSyncQueue } from "./sync";
import { useAuth } from "./auth-context";

const OfflineContext = createContext<null>(null);

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const { shop } = useAuth();
  const initialized = useRef(false);

  useEffect(() => {
    if (!shop?.id || initialized.current) return;
    initialized.current = true;

    // Charger les données du serveur dans le cache local
    refreshLocalCache(shop.id);

    // Traiter la file de sync au démarrage
    processSyncQueue();

    // Sync quand on revient en ligne
    const onOnline = () => {
      refreshLocalCache(shop.id);
      processSyncQueue();
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [shop?.id]);

  return <OfflineContext.Provider value={null}>{children}</OfflineContext.Provider>;
}

export const useOffline = () => useContext(OfflineContext);
