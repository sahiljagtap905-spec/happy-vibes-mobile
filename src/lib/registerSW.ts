// Register the service worker — guarded against Lovable preview iframes
// to avoid stale caches & nav interference during development.
export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  const isInIframe = (() => {
    try { return window.self !== window.top; } catch { return true; }
  })();
  const isPreviewHost =
    location.hostname.includes("id-preview--") ||
    location.hostname.includes("lovableproject.com") ||
    location.hostname === "localhost";

  if (isInIframe || isPreviewHost) {
    // Make sure no leftover SW from prior published visits is intercepting.
    navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => console.warn("SW register failed", err));
  });
}
