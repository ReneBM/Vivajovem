-- Tabela para configurações de API (WhatsApp, IA, etc)
CREATE TABLE public.api_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL UNIQUE, -- 'whatsapp', 'ai', etc
  nome text NOT NULL,
  configuracao jsonb NOT NULL DEFAULT '{}',
  ativa boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.api_configurations ENABLE ROW LEVEL SECURITY;

-- Only admins can manage API configurations
CREATE POLICY "Admins can manage API configurations"
ON public.api_configurations
FOR ALL
USING (has_role(auth.uid(), 'ADMIN'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_api_configurations_updated_at
BEFORE UPDATE ON public.api_configurations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela para mensagens de WhatsApp
CREATE TABLE public.whatsapp_mensagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL DEFAULT 'manual', -- 'manual', 'agendada', 'automatica'
  destinatarios jsonb NOT NULL DEFAULT '[]', -- array de telefones ou IDs de jovens
  mensagem text NOT NULL,
  status text NOT NULL DEFAULT 'pendente', -- 'pendente', 'enviando', 'enviado', 'falha'
  agendado_para timestamp with time zone,
  enviado_em timestamp with time zone,
  erro text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whatsapp_mensagens ENABLE ROW LEVEL SECURITY;

-- Admins and leaders can manage WhatsApp messages
CREATE POLICY "Admins and leaders can view messages"
ON public.whatsapp_mensagens
FOR SELECT
USING (is_admin_or_leader(auth.uid()));

CREATE POLICY "Admins and leaders can insert messages"
ON public.whatsapp_mensagens
FOR INSERT
WITH CHECK (is_admin_or_leader(auth.uid()));

CREATE POLICY "Admins and leaders can update messages"
ON public.whatsapp_mensagens
FOR UPDATE
USING (is_admin_or_leader(auth.uid()));

CREATE POLICY "Admins and leaders can delete messages"
ON public.whatsapp_mensagens
FOR DELETE
USING (is_admin_or_leader(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_whatsapp_mensagens_updated_at
BEFORE UPDATE ON public.whatsapp_mensagens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar campo qr_code_url na tabela campanhas para páginas específicas de campanha
ALTER TABLE public.campanhas ADD COLUMN IF NOT EXISTS slug text UNIQUE;
ALTER TABLE public.campanhas ADD COLUMN IF NOT EXISTS campos_personalizados jsonb DEFAULT '[]';
ALTER TABLE public.campanhas ADD COLUMN IF NOT EXISTS cor_primaria text DEFAULT '#7C3AED';
ALTER TABLE public.campanhas ADD COLUMN IF NOT EXISTS cor_fundo text DEFAULT '#1a1a2e';
ALTER TABLE public.campanhas ADD COLUMN IF NOT EXISTS imagem_capa_url text;