-- Create enum types for the system
CREATE TYPE public.app_role AS ENUM ('ADMIN', 'LIDER', 'USUARIO');
CREATE TYPE public.user_status AS ENUM ('ATIVO', 'INATIVO');
CREATE TYPE public.relationship_status AS ENUM ('ORANDO', 'NAMORANDO', 'NOIVADO', 'CASADO');
CREATE TYPE public.event_type AS ENUM ('CULTO', 'REUNIAO', 'CAMPANHA', 'ESPECIAL');
CREATE TYPE public.ecclesiastical_title AS ENUM ('MEMBRO', 'OBREIRO', 'DIACONO', 'PRESBITERO', 'EVANGELISTA', 'PASTOR');

-- Profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  status user_status NOT NULL DEFAULT 'ATIVO',
  ultimo_acesso TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'USUARIO',
  UNIQUE(user_id, role)
);

-- Leaders table
CREATE TABLE public.lideres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status user_status NOT NULL DEFAULT 'ATIVO',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Groups table
CREATE TABLE public.grupos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  lider_id UUID REFERENCES public.lideres(id) ON DELETE SET NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Youth table (Jovens)
CREATE TABLE public.jovens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  foto_url TEXT,
  data_nascimento DATE,
  telefone TEXT,
  redes_sociais JSONB DEFAULT '{}',
  titulo_eclesiastico ecclesiastical_title DEFAULT 'MEMBRO',
  batizado BOOLEAN NOT NULL DEFAULT false,
  grupo_id UUID REFERENCES public.grupos(id) ON DELETE SET NULL,
  status user_status NOT NULL DEFAULT 'ATIVO',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Relationship history (never deleted)
CREATE TABLE public.historico_relacionamento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jovem_id UUID REFERENCES public.jovens(id) ON DELETE CASCADE NOT NULL,
  status_relacionamento relationship_status NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Events table
CREATE TABLE public.eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_evento TIMESTAMP WITH TIME ZONE NOT NULL,
  tipo event_type NOT NULL DEFAULT 'CULTO',
  grupo_id UUID REFERENCES public.grupos(id) ON DELETE SET NULL,
  criado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Attendance table (Presença)
CREATE TABLE public.presencas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id UUID REFERENCES public.eventos(id) ON DELETE CASCADE NOT NULL,
  jovem_id UUID REFERENCES public.jovens(id) ON DELETE CASCADE NOT NULL,
  presente BOOLEAN NOT NULL DEFAULT false,
  registrado_por UUID REFERENCES public.lideres(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(evento_id, jovem_id)
);

-- Campaigns table
CREATE TABLE public.campanhas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  ativa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Campaign registrations
CREATE TABLE public.inscricoes_campanha (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campanha_id UUID REFERENCES public.campanhas(id) ON DELETE CASCADE NOT NULL,
  nome_visitante TEXT NOT NULL,
  telefone TEXT,
  idade INTEGER,
  jovem_id UUID REFERENCES public.jovens(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lideres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grupos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jovens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_relacionamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presencas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campanhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inscricoes_campanha ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if user is admin or leader
CREATE OR REPLACE FUNCTION public.is_admin_or_leader(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('ADMIN', 'LIDER')
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "Admins can manage all profiles" ON public.profiles
  FOR ALL USING (public.has_role(auth.uid(), 'ADMIN'));

-- User roles policies
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'ADMIN'));

-- Leaders policies
CREATE POLICY "Authenticated users can view leaders" ON public.lideres
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage leaders" ON public.lideres
  FOR ALL USING (public.has_role(auth.uid(), 'ADMIN'));

-- Groups policies
CREATE POLICY "Authenticated users can view groups" ON public.grupos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins and leaders can manage groups" ON public.grupos
  FOR ALL USING (public.is_admin_or_leader(auth.uid()));

-- Youth policies
CREATE POLICY "Authenticated users can view youth" ON public.jovens
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins and leaders can manage youth" ON public.jovens
  FOR ALL USING (public.is_admin_or_leader(auth.uid()));

-- Relationship history policies
CREATE POLICY "Authenticated users can view relationship history" ON public.historico_relacionamento
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins and leaders can insert relationship history" ON public.historico_relacionamento
  FOR INSERT WITH CHECK (public.is_admin_or_leader(auth.uid()));

-- Events policies
CREATE POLICY "Authenticated users can view events" ON public.eventos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins and leaders can manage events" ON public.eventos
  FOR ALL USING (public.is_admin_or_leader(auth.uid()));

-- Attendance policies
CREATE POLICY "Authenticated users can view attendance" ON public.presencas
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins and leaders can manage attendance" ON public.presencas
  FOR ALL USING (public.is_admin_or_leader(auth.uid()));

-- Campaigns policies
CREATE POLICY "Anyone can view active campaigns" ON public.campanhas
  FOR SELECT USING (ativa = true);

CREATE POLICY "Authenticated users can view all campaigns" ON public.campanhas
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage campaigns" ON public.campanhas
  FOR ALL USING (public.has_role(auth.uid(), 'ADMIN'));

-- Campaign registrations policies
CREATE POLICY "Anyone can register for campaigns" ON public.inscricoes_campanha
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can view registrations" ON public.inscricoes_campanha
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage registrations" ON public.inscricoes_campanha
  FOR ALL USING (public.has_role(auth.uid(), 'ADMIN'));

-- Trigger for profile creation on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome, email)
  VALUES (new.id, COALESCE(new.raw_user_meta_data ->> 'nome', new.email), new.email);
  
  -- Default role is USUARIO
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'USUARIO');
  
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lideres_updated_at BEFORE UPDATE ON public.lideres
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_grupos_updated_at BEFORE UPDATE ON public.grupos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_jovens_updated_at BEFORE UPDATE ON public.jovens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_eventos_updated_at BEFORE UPDATE ON public.eventos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campanhas_updated_at BEFORE UPDATE ON public.campanhas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();