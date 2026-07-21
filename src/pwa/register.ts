// Guarded service-worker registration. Never registers in Lovable preview/dev
// or in iframes. Supports ?sw=off kill-switch.

const SW_PATH = "/sw.js";

const isLovablePreviewHost = (host: string) =>
  host.startsWith("id-preview--") ||
  host.startsWith("preview--") ||
  host === "lovableproject.com" ||
  host.endsWith(".lovableproject.com") ||
  host === "lovableproject-dev.com" ||
  host.endsWith(".lovableproject-dev.com") ||
  host === "beta.lovable.dev" ||
  host.endsWith(".beta.lovable.dev");

const shouldRefuse = () => {
  if (typeof window === "undefined") return true;
  if (!("serviceWorker" in navigator)) return true;
  if (!import.meta.env.PROD) return true;
  try {
    if (window.self !== window.top) return true;
  } catch {
    return true;
  }
  if (isLovablePreviewHost(window.location.hostname)) return true;
  if (new URL(window.location.href).searchParams.get("sw") === "off") return true;
  return false;
};

const unregisterExisting = async () => {
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      regs
        .filter((r) => r.active?.scriptURL.endsWith(SW_PATH))
        .map((r) => r.unregister()),
    );
  } catch {
    /* noop */
  }
};

export const registerPWA = () => {
  if (shouldRefuse()) {
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      unregisterExisting();
    }
    return;
  }
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(SW_PATH).catch(() => {
      /* noop */
    });
  });
};
