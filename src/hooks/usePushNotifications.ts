import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const VAPID_PUBLIC_KEY = "BBtCZ8VJTbzIEJDKD9Lgv0b1FLFU8h5Fs1urNuGy0apbLzbFA9X274KGOT_poYC_yV0QIKF-jZdg9Ykt0oLTnM8";

function urlBase64ToUint8Array(b64: string) {
  const padding = "=".repeat((4 - (b64.length % 4)) % 4);
  const base64 = (b64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function usePushNotifications() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const ok = typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;
    setSupported(ok);
    if (!ok) return;
    setPermission(Notification.permission);
    navigator.serviceWorker.getRegistration().then(async (reg) => {
      const sub = await reg?.pushManager.getSubscription();
      setSubscribed(!!sub);
    });
  }, []);

  const subscribe = useCallback(async () => {
    if (!supported) { toast.error("Push not supported on this device"); return; }
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") { toast.error("Notifications permission denied"); return; }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      const json = sub.toJSON();
      const { error } = await supabase.functions.invoke("push-subscribe", {
        body: { endpoint: json.endpoint, keys: json.keys, userAgent: navigator.userAgent },
      });
      if (error) throw error;
      setSubscribed(true);
      toast.success("Push notifications enabled");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to enable push");
    } finally { setBusy(false); }
  }, [supported]);

  const unsubscribe = useCallback(async () => {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await supabase.functions.invoke("push-subscribe", {
          method: "DELETE",
          body: { endpoint: sub.endpoint },
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
      toast.success("Push notifications disabled");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to disable push");
    } finally { setBusy(false); }
  }, []);

  return { supported, permission, subscribed, busy, subscribe, unsubscribe };
}
