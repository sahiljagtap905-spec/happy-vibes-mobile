DROP POLICY IF EXISTS "Users update own notifs" ON public.notifications;
CREATE POLICY "Users update own notifs" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);