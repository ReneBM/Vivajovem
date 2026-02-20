-- Drop ALL existing overly permissive policies first
DROP POLICY IF EXISTS "Authenticated users can manage leaders" ON public.lideres;
DROP POLICY IF EXISTS "Authenticated users can view leaders" ON public.lideres;
DROP POLICY IF EXISTS "Admins can manage leaders" ON public.lideres;
DROP POLICY IF EXISTS "Admins can update leaders" ON public.lideres;
DROP POLICY IF EXISTS "Admins can delete leaders" ON public.lideres;

DROP POLICY IF EXISTS "Authenticated users can manage groups" ON public.grupos;
DROP POLICY IF EXISTS "Authenticated users can view groups" ON public.grupos;
DROP POLICY IF EXISTS "Admins and leaders can create groups" ON public.grupos;
DROP POLICY IF EXISTS "Admins and leaders can update groups" ON public.grupos;
DROP POLICY IF EXISTS "Admins and leaders can delete groups" ON public.grupos;

DROP POLICY IF EXISTS "Authenticated users can manage events" ON public.eventos;
DROP POLICY IF EXISTS "Authenticated users can view events" ON public.eventos;
DROP POLICY IF EXISTS "Admins and leaders can create events" ON public.eventos;
DROP POLICY IF EXISTS "Admins and leaders can update events" ON public.eventos;
DROP POLICY IF EXISTS "Admins and leaders can delete events" ON public.eventos;

DROP POLICY IF EXISTS "Authenticated users can manage attendance" ON public.presencas;
DROP POLICY IF EXISTS "Authenticated users can view attendance" ON public.presencas;
DROP POLICY IF EXISTS "Admins and leaders can record attendance" ON public.presencas;
DROP POLICY IF EXISTS "Admins and leaders can update attendance" ON public.presencas;
DROP POLICY IF EXISTS "Admins and leaders can delete attendance" ON public.presencas;

DROP POLICY IF EXISTS "Authenticated users can manage campaigns" ON public.campanhas;
DROP POLICY IF EXISTS "Authenticated users can view campaigns" ON public.campanhas;
DROP POLICY IF EXISTS "Authenticated users can view all campaigns" ON public.campanhas;
DROP POLICY IF EXISTS "Anyone can view active campaigns" ON public.campanhas;
DROP POLICY IF EXISTS "Admins can create campaigns" ON public.campanhas;
DROP POLICY IF EXISTS "Admins can update campaigns" ON public.campanhas;
DROP POLICY IF EXISTS "Admins can delete campaigns" ON public.campanhas;

DROP POLICY IF EXISTS "Authenticated users can manage youth" ON public.jovens;
DROP POLICY IF EXISTS "Authenticated users can view youth" ON public.jovens;
DROP POLICY IF EXISTS "Admins and leaders can create youth" ON public.jovens;
DROP POLICY IF EXISTS "Admins and leaders can update youth" ON public.jovens;
DROP POLICY IF EXISTS "Admins and leaders can delete youth" ON public.jovens;

DROP POLICY IF EXISTS "Authenticated users can manage relationship history" ON public.historico_relacionamento;
DROP POLICY IF EXISTS "Authenticated users can view relationship history" ON public.historico_relacionamento;
DROP POLICY IF EXISTS "Admins and leaders can create relationship history" ON public.historico_relacionamento;
DROP POLICY IF EXISTS "Admins and leaders can update relationship history" ON public.historico_relacionamento;
DROP POLICY IF EXISTS "Admins and leaders can delete relationship history" ON public.historico_relacionamento;

-- LIDERES: Admin-only management, read access for authenticated users
CREATE POLICY "Authenticated users can view leaders" 
ON public.lideres 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Admins can insert leaders" 
ON public.lideres 
FOR INSERT 
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "Admins can update leaders" 
ON public.lideres 
FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'ADMIN'))
WITH CHECK (public.has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "Admins can delete leaders" 
ON public.lideres 
FOR DELETE 
TO authenticated
USING (public.has_role(auth.uid(), 'ADMIN'));

-- GRUPOS: Admin/Leader management, read access for authenticated users
CREATE POLICY "Authenticated users can view groups" 
ON public.grupos 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Admins and leaders can insert groups" 
ON public.grupos 
FOR INSERT 
TO authenticated
WITH CHECK (public.is_admin_or_leader(auth.uid()));

CREATE POLICY "Admins and leaders can update groups" 
ON public.grupos 
FOR UPDATE 
TO authenticated
USING (public.is_admin_or_leader(auth.uid()))
WITH CHECK (public.is_admin_or_leader(auth.uid()));

CREATE POLICY "Admins and leaders can delete groups" 
ON public.grupos 
FOR DELETE 
TO authenticated
USING (public.is_admin_or_leader(auth.uid()));

-- EVENTOS: Admin/Leader management, read access for authenticated users
CREATE POLICY "Authenticated users can view events" 
ON public.eventos 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Admins and leaders can insert events" 
ON public.eventos 
FOR INSERT 
TO authenticated
WITH CHECK (public.is_admin_or_leader(auth.uid()));

CREATE POLICY "Admins and leaders can update events" 
ON public.eventos 
FOR UPDATE 
TO authenticated
USING (public.is_admin_or_leader(auth.uid()))
WITH CHECK (public.is_admin_or_leader(auth.uid()));

CREATE POLICY "Admins and leaders can delete events" 
ON public.eventos 
FOR DELETE 
TO authenticated
USING (public.is_admin_or_leader(auth.uid()));

-- PRESENCAS: Admin/Leader management, read access for authenticated users
CREATE POLICY "Authenticated users can view attendance" 
ON public.presencas 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Admins and leaders can insert attendance" 
ON public.presencas 
FOR INSERT 
TO authenticated
WITH CHECK (public.is_admin_or_leader(auth.uid()));

CREATE POLICY "Admins and leaders can update attendance" 
ON public.presencas 
FOR UPDATE 
TO authenticated
USING (public.is_admin_or_leader(auth.uid()))
WITH CHECK (public.is_admin_or_leader(auth.uid()));

CREATE POLICY "Admins and leaders can delete attendance" 
ON public.presencas 
FOR DELETE 
TO authenticated
USING (public.is_admin_or_leader(auth.uid()));

-- CAMPANHAS: Admin-only management, read access for authenticated users
CREATE POLICY "Authenticated users can view campaigns" 
ON public.campanhas 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Admins can insert campaigns" 
ON public.campanhas 
FOR INSERT 
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "Admins can update campaigns" 
ON public.campanhas 
FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'ADMIN'))
WITH CHECK (public.has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "Admins can delete campaigns" 
ON public.campanhas 
FOR DELETE 
TO authenticated
USING (public.has_role(auth.uid(), 'ADMIN'));

-- JOVENS: Admin/Leader management, read access for authenticated users
CREATE POLICY "Authenticated users can view youth" 
ON public.jovens 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Admins and leaders can insert youth" 
ON public.jovens 
FOR INSERT 
TO authenticated
WITH CHECK (public.is_admin_or_leader(auth.uid()));

CREATE POLICY "Admins and leaders can update youth" 
ON public.jovens 
FOR UPDATE 
TO authenticated
USING (public.is_admin_or_leader(auth.uid()))
WITH CHECK (public.is_admin_or_leader(auth.uid()));

CREATE POLICY "Admins and leaders can delete youth" 
ON public.jovens 
FOR DELETE 
TO authenticated
USING (public.is_admin_or_leader(auth.uid()));

-- HISTORICO_RELACIONAMENTO: Admin/Leader management, read access for authenticated users
CREATE POLICY "Authenticated users can view relationship history" 
ON public.historico_relacionamento 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Admins and leaders can insert relationship history" 
ON public.historico_relacionamento 
FOR INSERT 
TO authenticated
WITH CHECK (public.is_admin_or_leader(auth.uid()));

CREATE POLICY "Admins and leaders can update relationship history" 
ON public.historico_relacionamento 
FOR UPDATE 
TO authenticated
USING (public.is_admin_or_leader(auth.uid()))
WITH CHECK (public.is_admin_or_leader(auth.uid()));

CREATE POLICY "Admins and leaders can delete relationship history" 
ON public.historico_relacionamento 
FOR DELETE 
TO authenticated
USING (public.is_admin_or_leader(auth.uid()));