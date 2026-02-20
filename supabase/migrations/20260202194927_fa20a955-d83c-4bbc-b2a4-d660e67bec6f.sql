-- Create separate nucleos table
CREATE TABLE public.nucleos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create junction table for nucleo-lider relationship (many-to-many)
CREATE TABLE public.nucleo_membros (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nucleo_id UUID NOT NULL REFERENCES public.nucleos(id) ON DELETE CASCADE,
  lider_id UUID NOT NULL REFERENCES public.lideres(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(nucleo_id, lider_id)
);

-- Enable RLS on nucleos
ALTER TABLE public.nucleos ENABLE ROW LEVEL SECURITY;

-- RLS policies for nucleos
CREATE POLICY "Authenticated users can view nucleos"
ON public.nucleos
FOR SELECT
USING (true);

CREATE POLICY "Admins and leaders can insert nucleos"
ON public.nucleos
FOR INSERT
WITH CHECK (is_admin_or_leader(auth.uid()));

CREATE POLICY "Admins and leaders can update nucleos"
ON public.nucleos
FOR UPDATE
USING (is_admin_or_leader(auth.uid()))
WITH CHECK (is_admin_or_leader(auth.uid()));

CREATE POLICY "Admins and leaders can delete nucleos"
ON public.nucleos
FOR DELETE
USING (is_admin_or_leader(auth.uid()));

-- Enable RLS on nucleo_membros
ALTER TABLE public.nucleo_membros ENABLE ROW LEVEL SECURITY;

-- RLS policies for nucleo_membros
CREATE POLICY "Authenticated users can view nucleo_membros"
ON public.nucleo_membros
FOR SELECT
USING (true);

CREATE POLICY "Admins and leaders can insert nucleo_membros"
ON public.nucleo_membros
FOR INSERT
WITH CHECK (is_admin_or_leader(auth.uid()));

CREATE POLICY "Admins and leaders can delete nucleo_membros"
ON public.nucleo_membros
FOR DELETE
USING (is_admin_or_leader(auth.uid()));

-- Update timestamp trigger for nucleos
CREATE TRIGGER update_nucleos_updated_at
BEFORE UPDATE ON public.nucleos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();