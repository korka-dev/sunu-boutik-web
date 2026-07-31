"use client";

import { useOnlineStatus } from "@/lib/use-online";
import { processSyncQueue } from "@/lib/sync";

export default function OfflineIndicator() {
  const { online, pendingCount } = useOnlineStatus();

  if (online && pendingCount === 0) return null;

  return (
    <div
      className={`no-print fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-full shadow-lg text-sm font-medium transition-all ${
        online
          ? "bg-amber-50 border border-amber-300 text-amber-800"
          : "bg-red-50 border border-red-300 text-red-700"
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full ${online ? "bg-amber-400" : "bg-red-500 animate-pulse"}`}
      />
      {online ? (
        <>
          {pendingCount} modification{pendingCount > 1 ? "s" : ""} en cours de synchronisation…
          <button
            onClick={() => processSyncQueue()}
            className="underline hover:no-underline ml-1"
          >
            Sync maintenant
          </button>
        </>
      ) : (
        "Hors connexion — les données sont sauvegardées localement"
      )}
    </div>
  );
}
