// Scheduled job: scans inventory for items expiring within 3 days,
// inserts in-app notifications, and sends Web Push to subscribed devices.
// Triggered hourly by pg_cron.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import webpush from "https://esm.sh/web-push@3.6.7";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Item {
  id: string;
  user_id: string;
  name: string;
  expires_at: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    webpush.setVapidDetails(
      Deno.env.get("VAPID_SUBJECT") ?? "mailto:admin@example.com",
      Deno.env.get("VAPID_PUBLIC_KEY")!,
      Deno.env.get("VAPID_PRIVATE_KEY")!,
    );

    const now = new Date();
    const horizon = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const { data: items, error } = await supabase
      .from("inventory_items")
      .select("id,user_id,name,expires_at")
      .lte("expires_at", horizon.toISOString())
      .gte("expires_at", new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;

    let processed = 0;
    let pushed = 0;

    for (const item of (items ?? []) as Item[]) {
      const days = Math.ceil((new Date(item.expires_at).getTime() - now.getTime()) / 86400000);
      const bucket = days <= 0 ? "0d" : days <= 1 ? "1d" : "3d";

      // Skip if already alerted at this bucket
      const { data: prev } = await supabase
        .from("expiry_alert_log")
        .select("bucket")
        .eq("item_id", item.id)
        .maybeSingle();
      if (prev?.bucket === bucket) continue;

      // Check user prefs
      const { data: prefs } = await supabase
        .from("notification_preferences")
        .select("expiry_alerts")
        .eq("user_id", item.user_id)
        .maybeSingle();
      if (prefs && !prefs.expiry_alerts) continue;

      const title = days <= 0 ? `${item.name} has expired` : `${item.name} expires in ${days} day${days === 1 ? "" : "s"}`;
      const body = "Tap to see rescue recipe ideas.";

      // In-app notification
      await supabase.from("notifications").insert({
        user_id: item.user_id,
        type: "expiry",
        title,
        body,
        related_item_id: item.id,
      });

      // Web Push to all user's devices
      const { data: subs } = await supabase
        .from("push_subscriptions")
        .select("id,endpoint,p256dh,auth")
        .eq("user_id", item.user_id);

      for (const s of subs ?? []) {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            JSON.stringify({ title, body, url: "/dashboard", tag: `expiry-${item.id}` }),
          );
          pushed++;
        } catch (err: unknown) {
          const status = (err as { statusCode?: number })?.statusCode;
          if (status === 404 || status === 410) {
            await supabase.from("push_subscriptions").delete().eq("id", s.id);
          }
        }
      }

      await supabase.from("expiry_alert_log").upsert({
        item_id: item.id,
        user_id: item.user_id,
        bucket,
        notified_at: new Date().toISOString(),
      });
      processed++;
    }

    return new Response(JSON.stringify({ ok: true, processed, pushed }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
