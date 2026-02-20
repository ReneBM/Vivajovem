-- Drop existing restrictive policies and create more permissive ones for authenticated users

-- JOVENS: Allow all authenticated users to insert/update/delete
DROP POLICY IF EXISTS "Admins and leaders can manage youth" ON public.jovens;

CREATE POLICY "Authenticated users can manage youth" 
ON public.jovens 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- LIDERES: Allow all authenticated users to insert/update/delete
DROP POLICY IF EXISTS "Admins can manage leaders" ON public.lideres;

CREATE POLICY "Authenticated users can manage leaders" 
ON public.lideres 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- GRUPOS: Allow all authenticated users to insert/update/delete
DROP POLICY IF EXISTS "Admins and leaders can manage groups" ON public.grupos;

CREATE POLICY "Authenticated users can manage groups" 
ON public.grupos 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- EVENTOS: Allow all authenticated users to insert/update/delete
DROP POLICY IF EXISTS "Admins and leaders can manage events" ON public.eventos;

CREATE POLICY "Authenticated users can manage events" 
ON public.eventos 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- PRESENCAS: Allow all authenticated users to insert/update/delete
DROP POLICY IF EXISTS "Admins and leaders can manage attendance" ON public.presencas;

CREATE POLICY "Authenticated users can manage attendance" 
ON public.presencas 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- CAMPANHAS: Allow all authenticated users to insert/update/delete
DROP POLICY IF EXISTS "Admins can manage campaigns" ON public.campanhas;

CREATE POLICY "Authenticated users can manage campaigns" 
ON public.campanhas 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- HISTORICO_RELACIONAMENTO: Allow all authenticated users to insert/update/delete
DROP POLICY IF EXISTS "Admins and leaders can insert relationship history" ON public.historico_relacionamento;

CREATE POLICY "Authenticated users can manage relationship history" 
ON public.historico_relacionamento 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);