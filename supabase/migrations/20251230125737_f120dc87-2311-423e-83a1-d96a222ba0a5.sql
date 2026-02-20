-- Table for visitor youth (separate from regular youth)
CREATE TABLE public.jovens_visitantes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  telefone TEXT,
  idade INTEGER,
  email TEXT,
  faz_parte_viva_jovem BOOLEAN DEFAULT false,
  observacao TEXT,
  evento_origem_id UUID REFERENCES public.eventos(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.jovens_visitantes ENABLE ROW LEVEL SECURITY;

-- Policies for visitor youth
CREATE POLICY "Authenticated users can view visitors" 
ON public.jovens_visitantes FOR SELECT USING (true);

CREATE POLICY "Admins and leaders can insert visitors" 
ON public.jovens_visitantes FOR INSERT 
WITH CHECK (is_admin_or_leader(auth.uid()));

CREATE POLICY "Admins and leaders can update visitors" 
ON public.jovens_visitantes FOR UPDATE 
USING (is_admin_or_leader(auth.uid()))
WITH CHECK (is_admin_or_leader(auth.uid()));

CREATE POLICY "Admins and leaders can delete visitors" 
ON public.jovens_visitantes FOR DELETE 
USING (is_admin_or_leader(auth.uid()));

-- Allow anonymous inserts for public landing page registrations
CREATE POLICY "Anyone can register as visitor" 
ON public.jovens_visitantes FOR INSERT 
WITH CHECK (true);

-- Table for event landing pages
CREATE TABLE public.landing_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  evento_id UUID REFERENCES public.eventos(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  imagem_capa_url TEXT,
  cor_primaria TEXT DEFAULT '#7C3AED',
  cor_fundo TEXT DEFAULT '#1a1a2e',
  campos_personalizados JSONB DEFAULT '[]'::jsonb,
  perguntar_viva_jovem BOOLEAN DEFAULT true,
  ativa BOOLEAN DEFAULT true,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;

-- Policies for landing pages
CREATE POLICY "Anyone can view active landing pages" 
ON public.landing_pages FOR SELECT USING (ativa = true);

CREATE POLICY "Authenticated users can view all landing pages" 
ON public.landing_pages FOR SELECT USING (true);

CREATE POLICY "Admins and leaders can manage landing pages" 
ON public.landing_pages FOR ALL 
USING (is_admin_or_leader(auth.uid()));

-- Table for landing page registrations
CREATE TABLE public.inscricoes_landing_page (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  landing_page_id UUID NOT NULL REFERENCES public.landing_pages(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  faz_parte_viva_jovem BOOLEAN DEFAULT false,
  dados_personalizados JSONB DEFAULT '{}'::jsonb,
  jovem_visitante_id UUID REFERENCES public.jovens_visitantes(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inscricoes_landing_page ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can register on landing pages" 
ON public.inscricoes_landing_page FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can view registrations" 
ON public.inscricoes_landing_page FOR SELECT USING (true);

CREATE POLICY "Admins and leaders can manage registrations" 
ON public.inscricoes_landing_page FOR ALL 
USING (is_admin_or_leader(auth.uid()));

-- Add triggers for updated_at
CREATE TRIGGER update_jovens_visitantes_updated_at
BEFORE UPDATE ON public.jovens_visitantes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_landing_pages_updated_at
BEFORE UPDATE ON public.landing_pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();