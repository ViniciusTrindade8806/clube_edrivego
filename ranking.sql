-- ============================================================
-- Cole no Supabase Dashboard → SQL Editor e execute.
-- Permite motoristas autenticados ver outros membros no ranking.
-- ============================================================

CREATE POLICY "membros autenticados veem ranking"
  ON public.membros FOR SELECT
  TO authenticated
  USING (true);
