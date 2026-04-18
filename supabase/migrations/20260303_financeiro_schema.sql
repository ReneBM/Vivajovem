-- ============================================
-- MÓDULO FINANCEIRO - Schema
-- ============================================

-- 1. Formas de Pagamento
CREATE TABLE IF NOT EXISTS public.fin_formas_pagamento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Centros de Custo
CREATE TABLE IF NOT EXISTS public.fin_centros_custo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Planos de Conta
CREATE TABLE IF NOT EXISTS public.fin_planos_conta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Contas Bancárias
CREATE TABLE IF NOT EXISTS public.fin_contas_bancarias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  banco TEXT,
  agencia TEXT,
  conta TEXT,
  tipo TEXT NOT NULL DEFAULT 'corrente' CHECK (tipo IN ('corrente', 'poupanca')),
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Produtos
CREATE TABLE IF NOT EXISTS public.fin_produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  preco NUMERIC(12,2) DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Lançamentos
CREATE TABLE IF NOT EXISTS public.fin_lancamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  tipo_pessoa TEXT CHECK (tipo_pessoa IN ('lider', 'visitante', 'jovem')),
  pessoa_id UUID,
  pessoa_nome TEXT,
  plano_conta_id UUID REFERENCES public.fin_planos_conta(id) ON DELETE SET NULL,
  centro_custo_id UUID REFERENCES public.fin_centros_custo(id) ON DELETE SET NULL,
  forma_pagamento_id UUID REFERENCES public.fin_formas_pagamento(id) ON DELETE SET NULL,
  conta_bancaria_id UUID REFERENCES public.fin_contas_bancarias(id) ON DELETE SET NULL,
  valor NUMERIC(12,2) NOT NULL DEFAULT 0,
  descricao TEXT,
  data_lancamento DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'cancelado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger updated_at para lançamentos
DROP TRIGGER IF EXISTS update_fin_lancamentos_updated_at ON public.fin_lancamentos;
CREATE TRIGGER update_fin_lancamentos_updated_at
  BEFORE UPDATE ON public.fin_lancamentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- RLS
-- ============================================
ALTER TABLE public.fin_formas_pagamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_centros_custo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_planos_conta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_contas_bancarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_lancamentos ENABLE ROW LEVEL SECURITY;

-- Políticas: SELECT, INSERT, UPDATE, DELETE para authenticated
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'fin_formas_pagamento',
    'fin_centros_custo',
    'fin_planos_conta',
    'fin_contas_bancarias',
    'fin_produtos',
    'fin_lancamentos'
  ] LOOP
    EXECUTE format('
      DROP POLICY IF EXISTS "Auth select %1$s" ON public.%1$s;
      CREATE POLICY "Auth select %1$s" ON public.%1$s FOR SELECT TO authenticated USING (true);

      DROP POLICY IF EXISTS "Auth insert %1$s" ON public.%1$s;
      CREATE POLICY "Auth insert %1$s" ON public.%1$s FOR INSERT TO authenticated WITH CHECK (true);

      DROP POLICY IF EXISTS "Auth update %1$s" ON public.%1$s;
      CREATE POLICY "Auth update %1$s" ON public.%1$s FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

      DROP POLICY IF EXISTS "Auth delete %1$s" ON public.%1$s;
      CREATE POLICY "Auth delete %1$s" ON public.%1$s FOR DELETE TO authenticated USING (true);
    ', tbl);
  END LOOP;
END$$;

-- Remover coluna FK simples (substituída por tabela N:N)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'fin_contas_bancarias' AND column_name = 'forma_pagamento_id'
  ) THEN
    ALTER TABLE public.fin_contas_bancarias DROP COLUMN forma_pagamento_id;
  END IF;
END$$;

-- Tabela N:N: Conta Bancária x Formas de Pagamento
CREATE TABLE IF NOT EXISTS public.fin_conta_formas_pagamento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conta_bancaria_id UUID NOT NULL REFERENCES public.fin_contas_bancarias(id) ON DELETE CASCADE,
  forma_pagamento_id UUID NOT NULL REFERENCES public.fin_formas_pagamento(id) ON DELETE CASCADE,
  UNIQUE(conta_bancaria_id, forma_pagamento_id)
);

ALTER TABLE public.fin_conta_formas_pagamento ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Auth select fin_conta_formas_pagamento" ON public.fin_conta_formas_pagamento;
CREATE POLICY "Auth select fin_conta_formas_pagamento" ON public.fin_conta_formas_pagamento FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Auth insert fin_conta_formas_pagamento" ON public.fin_conta_formas_pagamento;
CREATE POLICY "Auth insert fin_conta_formas_pagamento" ON public.fin_conta_formas_pagamento FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Auth delete fin_conta_formas_pagamento" ON public.fin_conta_formas_pagamento;
CREATE POLICY "Auth delete fin_conta_formas_pagamento" ON public.fin_conta_formas_pagamento FOR DELETE TO authenticated USING (true);
