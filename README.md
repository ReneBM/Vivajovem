# Viva Jovem - Sistema de Gestão

Sistema completo de gestão para o ministério Viva Jovem, focado em organização de eventos, controle de membros e engajamento.

## Tecnologias

- **Frontend**: Vite, React, TypeScript, Tailwind CSS, shadcn/ui.
- **Backend**: Supabase (Auth, Database, Storage).
- **Relatórios**: Recharts.

## Como rodar localmente

1. Clone o repositório.
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Configure as variáveis de ambiente (`.env`):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

## Estrutura do Projeto

- `src/features`: Módulos principais (Eventos, Jovens, Missões).
- `src/components`: Componentes de UI reutilizáveis.
- `src/integrations`: Configuração do Supabase.
- `supabase/migrations`: Scripts de banco de dados.
