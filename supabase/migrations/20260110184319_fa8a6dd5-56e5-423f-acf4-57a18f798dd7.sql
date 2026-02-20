-- Create roles table for custom roles with permissions
CREATE TABLE public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  descricao TEXT,
  permissoes JSONB NOT NULL DEFAULT '[]'::jsonb,
  cor TEXT DEFAULT '#7C3AED',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Policies for roles table
CREATE POLICY "Authenticated users can view roles"
ON public.roles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage roles"
ON public.roles FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'ADMIN'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_roles_updated_at
BEFORE UPDATE ON public.roles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create user_custom_roles junction table to assign custom roles to users
CREATE TABLE public.user_custom_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role_id)
);

-- Enable RLS
ALTER TABLE public.user_custom_roles ENABLE ROW LEVEL SECURITY;

-- Policies for user_custom_roles
CREATE POLICY "Users can view their own custom roles"
ON public.user_custom_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all custom roles"
ON public.user_custom_roles FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'ADMIN'::app_role));

CREATE POLICY "Admins can manage all custom roles"
ON public.user_custom_roles FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'ADMIN'::app_role));

-- Insert default roles with full permission sets
INSERT INTO public.roles (nome, descricao, permissoes, cor) VALUES
(
  'Administrador',
  'Acesso total ao sistema',
  '["visualizar_jovens", "cadastrar_jovens", "editar_jovens", "excluir_jovens", "visualizar_lideres", "cadastrar_lideres", "editar_lideres", "excluir_lideres", "visualizar_grupos", "gerenciar_grupos", "visualizar_eventos", "gerenciar_eventos", "criar_campanhas", "gerenciar_campanhas", "enviar_whatsapp", "gerenciar_usuarios", "configurar_apis", "visualizar_relatorios", "gerenciar_landing_pages", "gerenciar_funcoes"]',
  '#DC2626'
),
(
  'Líder',
  'Acesso para gestão de grupos e jovens',
  '["visualizar_jovens", "cadastrar_jovens", "editar_jovens", "visualizar_lideres", "visualizar_grupos", "visualizar_eventos", "gerenciar_eventos", "enviar_whatsapp", "visualizar_relatorios"]',
  '#7C3AED'
),
(
  'Voluntário',
  'Acesso limitado para visualização',
  '["visualizar_jovens", "visualizar_lideres", "visualizar_grupos", "visualizar_eventos"]',
  '#059669'
);

-- Create function to check user custom permissions
CREATE OR REPLACE FUNCTION public.user_has_permission(_user_id UUID, _permission TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_custom_roles ucr
    JOIN public.roles r ON r.id = ucr.role_id
    WHERE ucr.user_id = _user_id
      AND r.permissoes ? _permission
  )
  OR has_role(_user_id, 'ADMIN'::app_role)
$$;

-- Create function to get all user permissions
CREATE OR REPLACE FUNCTION public.get_user_permissions(_user_id UUID)
RETURNS JSONB
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT jsonb_agg(DISTINCT perm)
      FROM public.user_custom_roles ucr
      JOIN public.roles r ON r.id = ucr.role_id,
      LATERAL jsonb_array_elements_text(r.permissoes) AS perm
      WHERE ucr.user_id = _user_id
    ),
    CASE 
      WHEN has_role(_user_id, 'ADMIN'::app_role) THEN 
        '["visualizar_jovens", "cadastrar_jovens", "editar_jovens", "excluir_jovens", "visualizar_lideres", "cadastrar_lideres", "editar_lideres", "excluir_lideres", "visualizar_grupos", "gerenciar_grupos", "visualizar_eventos", "gerenciar_eventos", "criar_campanhas", "gerenciar_campanhas", "enviar_whatsapp", "gerenciar_usuarios", "configurar_apis", "visualizar_relatorios", "gerenciar_landing_pages", "gerenciar_funcoes"]'::jsonb
      ELSE '[]'::jsonb
    END
  )
$$;