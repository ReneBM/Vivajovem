
-- Add atribuivel_por to roles table (which app_role can assign this role)
ALTER TABLE public.roles ADD COLUMN atribuivel_por app_role[] NOT NULL DEFAULT ARRAY['ADMIN']::app_role[];

-- Add campanha_id to eventos table to link events to campaigns
ALTER TABLE public.eventos ADD COLUMN campanha_id uuid REFERENCES public.campanhas(id) ON DELETE SET NULL;

-- Drop landing pages related tables
DROP TABLE IF EXISTS public.inscricoes_landing_page;
DROP TABLE IF EXISTS public.landing_pages;
