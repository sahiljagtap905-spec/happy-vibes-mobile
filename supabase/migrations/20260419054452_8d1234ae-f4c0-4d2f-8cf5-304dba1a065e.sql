
DROP POLICY IF EXISTS "Avatars are publicly readable" ON storage.objects;

CREATE POLICY "Users view own avatar"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
