-- Create table for nucleo_lideres (many-to-many relationship between grupos and lideres)
CREATE TABLE public.nucleo_lideres (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  grupo_id uuid NOT NULL REFERENCES public.grupos(id) ON DELETE CASCADE,
  lider_id uuid NOT NULL REFERENCES public.lideres(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(grupo_id, lider_id)
);

-- Enable RLS
ALTER TABLE public.nucleo_lideres ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view nucleo_lideres"
ON public.nucleo_lideres
FOR SELECT
USING (true);

CREATE POLICY "Admins and leaders can insert nucleo_lideres"
ON public.nucleo_lideres
FOR INSERT
WITH CHECK (is_admin_or_leader(auth.uid()));

CREATE POLICY "Admins and leaders can delete nucleo_lideres"
ON public.nucleo_lideres
FOR DELETE
USING (is_admin_or_leader(auth.uid()));