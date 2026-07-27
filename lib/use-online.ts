"use client";

import { useEffect, useState } from "react";
import { processSyncQueue, getPendingCount } from "./sync";

export function useOnlineStatus() {
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const update = async () => {
      setOnline(navigator.onLine);
      const count = await getPendingCount();
      setPendingCount(count);
      if (navigator.onLine) processSyncQueue();
    };

    window.addEventListener("online", update);
    window.addEventListener("offline", update);

    const interval = setInterval(update, 5000);
    update();

    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      clearInterval(interval);
    };
  }, []);

  return { online, pendingCount };
}
