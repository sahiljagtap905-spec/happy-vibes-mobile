
-- Push subscriptions table
CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own subs" ON public.push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own subs" ON public.push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own subs" ON public.push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_push_subs_user ON public.push_subscriptions(user_id);

-- Track last expiry-alert sent per item to avoid duplicate notifications
CREATE TABLE public.expiry_alert_log (
  item_id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  bucket text NOT NULL, -- '3d' | '1d' | '0d'
  notified_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.expiry_alert_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own alert log" ON public.expiry_alert_log
  FOR SELECT USING (auth.uid() = user_id);

-- Schedule the expiry alert function every hour
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
