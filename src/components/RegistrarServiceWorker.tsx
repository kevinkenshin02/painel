"use client";

import { useEffect } from "react";

// Chrome/Edge/Android só oferecem "Instalar app" com um service worker ativo.
export default function RegistrarServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}
