-- Fix: Permitir DELETE para qualquer usuário autenticado
-- A verificação de permissão é feita no frontend via usePermissions()
-- Os botões de excluir só aparecem para quem tem a permissão configurada

-- JOVENS
DROP POLICY IF EXISTS "Admins and leaders can delete youth" ON public.jovens;
CREATE POLICY "Authenticated users can delete youth" ON public.jovens
  FOR DELETE TO authenticated USING (true);

-- LIDERES
DROP POLICY IF EXISTS "Admins can delete leaders" ON public.lideres;
CREATE POLICY "Authenticated users can delete leaders" ON public.lideres
  FOR DELETE TO authenticated USING (true);

-- GRUPOS
DROP POLICY IF EXISTS "Admins and leaders can delete groups" ON public.grupos;
CREATE POLICY "Authenticated users can delete groups" ON public.grupos
  FOR DELETE TO authenticated USING (true);

-- EVENTOS
DROP POLICY IF EXISTS "Admins and leaders can delete events" ON public.eventos;
CREATE POLICY "Authenticated users can delete events" ON public.eventos
  FOR DELETE TO authenticated USING (true);

-- PRESENCAS
DROP POLICY IF EXISTS "Admins and leaders can delete attendance" ON public.presencas;
CREATE POLICY "Authenticated users can delete attendance" ON public.presencas
  FOR DELETE TO authenticated USING (true);

-- HISTORICO_RELACIONAMENTO
DROP POLICY IF EXISTS "Admins and leaders can delete relationship history" ON public.historico_relacionamento;
CREATE POLICY "Authenticated users can delete relationship history" ON public.historico_relacionamento
  FOR DELETE TO authenticated USING (true);
