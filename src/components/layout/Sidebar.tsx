import { useLocation } from 'react-router-dom';
import { NavLink } from '@/components/shared/NavLink';
import { cn } from '@/lib/utils';
import { useAuth } from '@/features/auth/context/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Calendar,
  BarChart3,
  Megaphone,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronDown,
  Menu,
  UserPlus,
  FileText,
  Cake,
  FolderKanban,
  UserCheck,
  UserCog,
  MessageCircle,
  Shield,
} from 'lucide-react';
import { useState } from 'react';
import sloganImage from '@/assets/slogan-somosum.png';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  /** Permissão necessária para ver este item (ex: 'cadastro.jovens.visualizar') */
  permission?: string;
}

interface NavModule {
  name: string;
  icon: React.ElementType;
  items: NavItem[];
  /** Prefixo de permissão do módulo (ex: 'cadastro', 'eventos') */
  permissionPrefix?: string;
}

const modules: NavModule[] = [
  {
    name: 'Cadastro',
    icon: Users,
    permissionPrefix: 'cadastro',
    items: [
      { name: 'Jovens', href: '/jovens', icon: Users, permission: 'cadastro.jovens.visualizar' },
      { name: 'Visitantes', href: '/jovens-visitantes', icon: UserPlus, permission: 'cadastro.visitantes.visualizar' },
      { name: 'Líderes', href: '/lideres', icon: UserCheck, permission: 'cadastro.lideres.visualizar' },
    ],
  },
  {
    name: 'Eventos',
    icon: Calendar,
    permissionPrefix: 'eventos',
    items: [
      { name: 'Calendário', href: '/eventos', icon: Calendar, permission: 'eventos.eventos.visualizar' },
    ],
  },
  {
    name: 'Organização',
    icon: Briefcase,
    permissionPrefix: 'organizacao',
    items: [
      { name: 'Grupos', href: '/grupos', icon: FolderKanban, permission: 'organizacao.grupos.visualizar' },
      { name: 'Núcleos', href: '/nucleos', icon: Briefcase, permission: 'organizacao.nucleos.visualizar' },
    ],
  },
  {
    name: 'Marketing',
    icon: Megaphone,
    permissionPrefix: 'marketing',
    items: [
      { name: 'Campanhas', href: '/campanhas', icon: Megaphone, permission: 'marketing.campanhas.visualizar' },
      { name: 'WhatsApp', href: '/marketing', icon: MessageCircle, permission: 'marketing.whatsapp.visualizar' },
    ],
  },
  {
    name: 'Segurança',
    icon: Shield,
    permissionPrefix: 'seguranca',
    items: [
      { name: 'Usuários', href: '/usuarios', icon: UserCog, permission: 'seguranca.usuarios.visualizar' },
      { name: 'Funções', href: '/funcoes', icon: Shield, permission: 'seguranca.funcoes.visualizar' },
    ],
  },
];

const standaloneItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Aniversariantes', href: '/aniversariantes', icon: Cake, permission: 'cadastro.jovens.visualizar' },
  { name: 'Relatórios', href: '/relatorios', icon: BarChart3, permission: 'relatorios.relatorios.visualizar' },
];

export default function Sidebar() {
  const { signOut } = useAuth();
  const { hasPermission, hasAnyPermission, isAdmin } = usePermissions();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => window.innerWidth < 1024);

  // Verificar se o item é visível com base na permissão
  const canSeeItem = (item: NavItem) => {
    if (isAdmin) return true;
    if (!item.permission) return true;
    return hasPermission(item.permission);
  };

  // Filtrar módulos: mostrar se o usuário tem qualquer permissão de visualização no módulo
  const filteredModules = modules
    .map((m) => ({
      ...m,
      items: m.items.filter(canSeeItem),
    }))
    .filter((m) => m.items.length > 0);

  // Filtrar itens standalone por permissão
  const filteredStandaloneItems = standaloneItems.filter(canSeeItem);

  const handleNavClick = () => {
    if (window.innerWidth < 1024) {
      setCollapsed(true);
    }
  };

  const [openModules, setOpenModules] = useState<string[]>(() => {
    // Open modules that contain the current route
    const initialOpen: string[] = [];
    filteredModules.forEach((module) => {
      if (module.items.some((item) => item.href === location.pathname)) {
        initialOpen.push(module.name);
      }
    });
    return initialOpen;
  });

  const toggleModule = (moduleName: string) => {
    setOpenModules((prev) =>
      prev.includes(moduleName)
        ? prev.filter((m) => m !== moduleName)
        : [...prev, moduleName]
    );
  };

  const isModuleActive = (module: NavModule) =>
    module.items.some((item) => location.pathname === item.href);

  return (
    <>
      {/* Mobile overlay */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="shadow-lg"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col bg-sidebar transition-all duration-300',
          collapsed ? '-translate-x-full lg:translate-x-0 lg:w-20' : 'w-64',
          'lg:relative lg:translate-x-0'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-20 px-4 border-b border-sidebar-border">
          <div className={cn('flex items-center gap-3', collapsed && 'lg:justify-center')}>
            <img
              src={sloganImage}
              alt="VIVA Jovem - Somos Um"
              className={cn('transition-all duration-300 object-contain', collapsed ? 'w-10 h-10' : 'h-12 w-auto max-w-[140px]')}
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <ChevronLeft className={cn('w-5 h-5 transition-transform', collapsed && 'rotate-180')} />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {/* Standalone items (Dashboard) */}
            {filteredStandaloneItems.slice(0, 1).map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <li key={item.name}>
                  <NavLink
                    to={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-accent'
                        : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                      collapsed && 'lg:justify-center lg:px-2'
                    )}
                    onClick={handleNavClick}
                  >
                    <item.icon className={cn('w-5 h-5 shrink-0', isActive && 'text-sidebar-primary-foreground')} />
                    {!collapsed && <span>{item.name}</span>}
                  </NavLink>
                </li>
              );
            })}

            {/* Modules with dropdowns */}
            {filteredModules.map((module) => (
              <li key={module.name}>
                {collapsed ? (
                  // When collapsed, show only the icon with tooltip
                  <div
                    className={cn(
                      'flex items-center justify-center px-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                      isModuleActive(module)
                        ? 'bg-sidebar-primary/20 text-sidebar-primary'
                        : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                    )}
                  >
                    <module.icon className="w-5 h-5 shrink-0" />
                  </div>
                ) : (
                  <Collapsible
                    open={openModules.includes(module.name)}
                    onOpenChange={() => toggleModule(module.name)}
                  >
                    <CollapsibleTrigger asChild>
                      <button
                        className={cn(
                          'w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                          isModuleActive(module)
                            ? 'bg-sidebar-primary/10 text-sidebar-primary'
                            : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <module.icon className="w-5 h-5 shrink-0" />
                          <span>{module.name}</span>
                        </div>
                        <ChevronDown
                          className={cn(
                            'w-4 h-4 transition-transform',
                            openModules.includes(module.name) && 'rotate-180'
                          )}
                        />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-1 ml-4 space-y-1">
                      {module.items.map((item) => {
                        const isActive = location.pathname === item.href;
                        return (
                          <NavLink
                            key={item.href}
                            to={item.href}
                            className={cn(
                              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                              isActive
                                ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-accent'
                                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                            )}
                            onClick={handleNavClick}
                          >
                            <item.icon className={cn('w-4 h-4 shrink-0', isActive && 'text-sidebar-primary-foreground')} />
                            <span>{item.name}</span>
                          </NavLink>
                        );
                      })}
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </li>
            ))}

            {/* Remaining standalone items */}
            {filteredStandaloneItems.slice(1).map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <li key={item.name}>
                  <NavLink
                    to={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-accent'
                        : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                      collapsed && 'lg:justify-center lg:px-2'
                    )}
                    onClick={handleNavClick}
                  >
                    <item.icon className={cn('w-5 h-5 shrink-0', isActive && 'text-sidebar-primary-foreground')} />
                    {!collapsed && <span>{item.name}</span>}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-sidebar-border">
          {isAdmin && (
            <NavLink
              to="/configuracoes"
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all duration-200 mb-1',
                collapsed && 'lg:justify-center lg:px-2'
              )}
              onClick={handleNavClick}
            >
              <Settings className="w-5 h-5 shrink-0" />
              {!collapsed && <span>Configurações</span>}
            </NavLink>
          )}
          <button
            onClick={signOut}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive/80 hover:bg-destructive/10 hover:text-destructive transition-all duration-200',
              collapsed && 'lg:justify-center lg:px-2'
            )}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* Mobile backdrop */}
      {!collapsed && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-foreground/50 backdrop-blur-sm"
          onClick={() => setCollapsed(true)}
        />
      )}
    </>
  );
}