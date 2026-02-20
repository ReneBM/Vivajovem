import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';

// ── Hierarchical permission structure: Módulo → Recurso → Ações ──

export interface PermissionAction {
  key: string;
  label: string;
}

export interface PermissionResource {
  key: string;
  label: string;
  actions: PermissionAction[];
}

export interface PermissionModule {
  key: string;
  label: string;
  resources: PermissionResource[];
}

const ACTIONS_CRUD: PermissionAction[] = [
  { key: 'visualizar', label: 'Visualizar' },
  { key: 'criar', label: 'Criar' },
  { key: 'editar', label: 'Editar' },
  { key: 'excluir', label: 'Excluir' },
];

export const PERMISSION_MODULES: PermissionModule[] = [
  {
    key: 'cadastro',
    label: 'Cadastro',
    resources: [
      { key: 'jovens', label: 'Jovens', actions: [...ACTIONS_CRUD] },
      { key: 'lideres', label: 'Líderes', actions: [...ACTIONS_CRUD] },
      { key: 'visitantes', label: 'Visitantes', actions: [...ACTIONS_CRUD] },
      {
        key: 'aniversariantes', label: 'Aniversariantes', actions: [
          { key: 'visualizar', label: 'Visualizar' },
        ]
      },
    ],
  },
  {
    key: 'eventos',
    label: 'Eventos',
    resources: [
      { key: 'eventos', label: 'Eventos', actions: [...ACTIONS_CRUD] },
      {
        key: 'inscricoes', label: 'Inscrições', actions: [
          { key: 'visualizar', label: 'Visualizar' },
          { key: 'criar', label: 'Criar' },
          { key: 'editar', label: 'Editar' },
          { key: 'excluir', label: 'Excluir' },
        ]
      },
      {
        key: 'presenca', label: 'Presença / Frequência', actions: [
          { key: 'visualizar', label: 'Visualizar' },
          { key: 'registrar', label: 'Registrar' },
        ]
      },
    ],
  },
  {
    key: 'organizacao',
    label: 'Organização',
    resources: [
      { key: 'grupos', label: 'Grupos', actions: [...ACTIONS_CRUD] },
      { key: 'nucleos', label: 'Núcleos', actions: [...ACTIONS_CRUD] },
    ],
  },
  {
    key: 'marketing',
    label: 'Marketing',
    resources: [
      { key: 'campanhas', label: 'Campanhas', actions: [...ACTIONS_CRUD] },
      {
        key: 'whatsapp', label: 'WhatsApp', actions: [
          { key: 'visualizar', label: 'Visualizar' },
          { key: 'enviar', label: 'Enviar' },
        ]
      },
    ],
  },
  {
    key: 'relatorios',
    label: 'Relatórios',
    resources: [
      {
        key: 'relatorios', label: 'Relatórios', actions: [
          { key: 'visualizar', label: 'Visualizar' },
          { key: 'exportar', label: 'Exportar' },
        ]
      },
    ],
  },
  {
    key: 'seguranca',
    label: 'Segurança',
    resources: [
      { key: 'usuarios', label: 'Usuários', actions: [...ACTIONS_CRUD] },
      { key: 'funcoes', label: 'Funções', actions: [...ACTIONS_CRUD] },
      {
        key: 'configuracoes', label: 'Configurações', actions: [
          { key: 'visualizar', label: 'Visualizar' },
          { key: 'editar', label: 'Editar' },
        ]
      },
    ],
  },
];

// Build permission key: "modulo.recurso.acao" e.g. "cadastro.jovens.visualizar"
export function buildPermissionKey(moduleKey: string, resourceKey: string, actionKey: string): string {
  return `${moduleKey}.${resourceKey}.${actionKey}`;
}

// Get all permission keys for a resource
export function getResourcePermissionKeys(moduleKey: string, resource: PermissionResource): string[] {
  return resource.actions.map(a => buildPermissionKey(moduleKey, resource.key, a.key));
}

// Get all permission keys for a module
export function getModulePermissionKeys(module: PermissionModule): string[] {
  return module.resources.flatMap(r => getResourcePermissionKeys(module.key, r));
}

// Get ALL permission keys in the system
export function getAllPermissionKeys(): string[] {
  return PERMISSION_MODULES.flatMap(m => getModulePermissionKeys(m));
}

// Legacy mapping for backward compatibility with old permission keys
const LEGACY_MAP: Record<string, string> = {
  'visualizar_jovens': 'cadastro.jovens.visualizar',
  'cadastrar_jovens': 'cadastro.jovens.criar',
  'editar_jovens': 'cadastro.jovens.editar',
  'excluir_jovens': 'cadastro.jovens.excluir',
  'visualizar_lideres': 'cadastro.lideres.visualizar',
  'cadastrar_lideres': 'cadastro.lideres.criar',
  'editar_lideres': 'cadastro.lideres.editar',
  'excluir_lideres': 'cadastro.lideres.excluir',
  'visualizar_grupos': 'organizacao.grupos.visualizar',
  'gerenciar_grupos': 'organizacao.grupos.editar',
  'visualizar_eventos': 'eventos.eventos.visualizar',
  'gerenciar_eventos': 'eventos.eventos.editar',
  'criar_campanhas': 'marketing.campanhas.criar',
  'gerenciar_campanhas': 'marketing.campanhas.editar',
  'gerenciar_landing_pages': 'marketing.landing_pages.editar',
  'enviar_whatsapp': 'marketing.whatsapp.enviar',
  'gerenciar_usuarios': 'seguranca.usuarios.editar',
  'configurar_apis': 'seguranca.funcoes.editar',
  'visualizar_relatorios': 'relatorios.relatorios.visualizar',
  'gerenciar_funcoes': 'seguranca.funcoes.editar',
};

function normalizeLegacyPermissions(perms: string[]): string[] {
  return perms.map(p => LEGACY_MAP[p] || p);
}

export type PermissionKey = string;

export function usePermissions() {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPermissions();
    } else {
      setPermissions([]);
      setIsAdmin(false);
      setLoading(false);
    }
  }, [user]);

  async function fetchPermissions() {
    if (!user) return;

    try {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (roleData?.role === 'ADMIN') {
        setIsAdmin(true);
        setPermissions(getAllPermissionKeys());
      } else {
        setIsAdmin(false);
        const { data: customRoles } = await supabase
          .from('user_custom_roles')
          .select('role_id, roles(permissoes)')
          .eq('user_id', user.id);

        if (customRoles && customRoles.length > 0) {
          const allPermissions = new Set<string>();
          customRoles.forEach((ucr: any) => {
            const perms = ucr.roles?.permissoes as string[];
            if (perms) {
              normalizeLegacyPermissions(perms).forEach(p => allPermissions.add(p));
            }
          });
          setPermissions(Array.from(allPermissions));
        } else {
          setPermissions([]);
        }
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }

  function hasPermission(permission: string): boolean {
    if (isAdmin) return true;
    return permissions.includes(permission);
  }

  function hasAnyPermission(perms: string[]): boolean {
    if (isAdmin) return true;
    return perms.some(p => permissions.includes(p));
  }

  function hasAllPermissions(perms: string[]): boolean {
    if (isAdmin) return true;
    return perms.every(p => permissions.includes(p));
  }

  return {
    permissions,
    loading,
    isAdmin,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    refetch: fetchPermissions,
  };
}
