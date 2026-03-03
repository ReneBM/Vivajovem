-- Fix: Permitir DELETE/INSERT para qualquer usuário autenticado
-- A verificação de permissão é feita no frontend via usePermissions()

-- JOVENS
DROP POLICY IF EXISTS "Admins and leaders can delete youth" ON public.jovens;
DROP POLICY IF EXISTS "Authenticated users can delete youth" ON public.jovens;
CREATE POLICY "Authenticated users can delete youth" ON public.jovens
  FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins and leaders can insert youth" ON public.jovens;
DROP POLICY IF EXISTS "Authenticated users can insert youth" ON public.jovens;
CREATE POLICY "Authenticated users can insert youth" ON public.jovens
  FOR INSERT TO authenticated WITH CHECK (true);

-- LIDERES
DROP POLICY IF EXISTS "Admins can delete leaders" ON public.lideres;
DROP POLICY IF EXISTS "Authenticated users can delete leaders" ON public.lideres;
CREATE POLICY "Authenticated users can delete leaders" ON public.lideres
  FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can insert leaders" ON public.lideres;
DROP POLICY IF EXISTS "Authenticated users can insert leaders" ON public.lideres;
CREATE POLICY "Authenticated users can insert leaders" ON public.lideres
  FOR INSERT TO authenticated WITH CHECK (true);

-- GRUPOS
DROP POLICY IF EXISTS "Admins and leaders can delete groups" ON public.grupos;
DROP POLICY IF EXISTS "Authenticated users can delete groups" ON public.grupos;
CREATE POLICY "Authenticated users can delete groups" ON public.grupos
  FOR DELETE TO authenticated USING (true);

-- EVENTOS
DROP POLICY IF EXISTS "Admins and leaders can delete events" ON public.eventos;
DROP POLICY IF EXISTS "Authenticated users can delete events" ON public.eventos;
CREATE POLICY "Authenticated users can delete events" ON public.eventos
  FOR DELETE TO authenticated USING (true);

-- PRESENCAS
DROP POLICY IF EXISTS "Admins and leaders can delete attendance" ON public.presencas;
DROP POLICY IF EXISTS "Authenticated users can delete attendance" ON public.presencas;
CREATE POLICY "Authenticated users can delete attendance" ON public.presencas
  FOR DELETE TO authenticated USING (true);

-- HISTORICO_RELACIONAMENTO
DROP POLICY IF EXISTS "Admins and leaders can delete relationship history" ON public.historico_relacionamento;
DROP POLICY IF EXISTS "Authenticated users can delete relationship history" ON public.historico_relacionamento;
CREATE POLICY "Authenticated users can delete relationship history" ON public.historico_relacionamento
  FOR DELETE TO authenticated USING (true);

-- INSCRICOES_CAMPANHA: Permitir UPDATE e DELETE para authenticated
DROP POLICY IF EXISTS "Admins can manage registrations" ON public.inscricoes_campanha;
DROP POLICY IF EXISTS "Authenticated users can update registrations" ON public.inscricoes_campanha;
DROP POLICY IF EXISTS "Authenticated users can delete registrations" ON public.inscricoes_campanha;

CREATE POLICY "Authenticated users can update registrations" ON public.inscricoes_campanha
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete registrations" ON public.inscricoes_campanha
  FOR DELETE TO authenticated USING (true);

-- JOVENS_VISITANTES: Permitir INSERT para authenticated
DROP POLICY IF EXISTS "Authenticated users can insert visitors" ON public.jovens_visitantes;
CREATE POLICY "Authenticated users can insert visitors" ON public.jovens_visitantes
  FOR INSERT TO authenticated WITH CHECK (true);
