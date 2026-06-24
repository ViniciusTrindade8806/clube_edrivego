-- ============================================================
-- Cole este SQL no Supabase Dashboard → SQL Editor e execute.
-- ============================================================

-- 1. Adicionar coluna avatar_url na tabela membros
ALTER TABLE public.membros
  ADD COLUMN IF NOT EXISTS avatar_url text;

-- 2. Criar bucket público para avatares
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 3. Políticas de Storage
-- Leitura pública (para exibir as fotos)
CREATE POLICY "Avatars sao publicos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

-- Upload / atualização pelo próprio usuário
CREATE POLICY "Usuarios gerenciam proprio avatar"
  ON storage.objects FOR ALL
  TO authenticated
  USING     (bucket_id = 'avatars' AND split_part(name, '/', 1) = auth.uid()::text)
  WITH CHECK (bucket_id = 'avatars' AND split_part(name, '/', 1) = auth.uid()::text);
