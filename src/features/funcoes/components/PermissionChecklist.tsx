import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  PERMISSION_MODULES,
  buildPermissionKey,
  getModulePermissionKeys,
  getResourcePermissionKeys,
  type PermissionModule,
  type PermissionResource,
} from '@/hooks/usePermissions';
import {
  ChevronDown,
  ChevronRight,
  Users,
  Calendar,
  Briefcase,
  Megaphone,
  BarChart3,
  Shield,
  Check,
  Minus,
} from 'lucide-react';

const MODULE_ICONS: Record<string, React.ElementType> = {
  cadastro: Users,
  eventos: Calendar,
  organizacao: Briefcase,
  marketing: Megaphone,
  relatorios: BarChart3,
  seguranca: Shield,
};

interface PermissionChecklistProps {
  selected: string[];
  onChange: (permissions: string[]) => void;
  accentColor?: string;
}

function CustomCheck({ checked, indeterminate, onClick }: { checked: boolean; indeterminate?: boolean; onClick: (e: React.MouseEvent) => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-4 w-4 shrink-0 rounded-sm border border-primary flex items-center justify-center transition-colors',
        checked && 'bg-primary text-primary-foreground',
        indeterminate && !checked && 'bg-primary/50 text-primary-foreground',
        !checked && !indeterminate && 'bg-background'
      )}
    >
      {checked && <Check className="h-3 w-3" />}
      {indeterminate && !checked && <Minus className="h-3 w-3" />}
    </button>
  );
}

export default function PermissionChecklist({ selected, onChange }: PermissionChecklistProps) {
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [expandedResources, setExpandedResources] = useState<string[]>([]);

  const toggleExpand = (key: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(key) ? list.filter(k => k !== key) : [...list, key]);
  };

  const isActionChecked = (moduleKey: string, resourceKey: string, actionKey: string) =>
    selected.includes(buildPermissionKey(moduleKey, resourceKey, actionKey));

  const isResourceAllChecked = (moduleKey: string, resource: PermissionResource) =>
    getResourcePermissionKeys(moduleKey, resource).every(k => selected.includes(k));

  const isResourceSomeChecked = (moduleKey: string, resource: PermissionResource) =>
    getResourcePermissionKeys(moduleKey, resource).some(k => selected.includes(k));

  const isModuleAllChecked = (module: PermissionModule) =>
    getModulePermissionKeys(module).every(k => selected.includes(k));

  const isModuleSomeChecked = (module: PermissionModule) =>
    getModulePermissionKeys(module).some(k => selected.includes(k));

  function toggleAction(moduleKey: string, resourceKey: string, actionKey: string) {
    const key = buildPermissionKey(moduleKey, resourceKey, actionKey);
    const viewKey = buildPermissionKey(moduleKey, resourceKey, 'visualizar');

    if (actionKey === 'visualizar' && selected.includes(key)) {
      const resourceKeys = PERMISSION_MODULES
        .find(m => m.key === moduleKey)?.resources
        .find(r => r.key === resourceKey)?.actions
        .map(a => buildPermissionKey(moduleKey, resourceKey, a.key)) || [];
      onChange(selected.filter(p => !resourceKeys.includes(p)));
    } else if (selected.includes(key)) {
      onChange(selected.filter(p => p !== key));
    } else {
      const newPerms = [...selected, key];
      if (actionKey !== 'visualizar' && !newPerms.includes(viewKey)) {
        newPerms.push(viewKey);
      }
      onChange(newPerms);
    }
  }

  function toggleResource(moduleKey: string, resource: PermissionResource) {
    const keys = getResourcePermissionKeys(moduleKey, resource);
    if (isResourceAllChecked(moduleKey, resource)) {
      onChange(selected.filter(p => !keys.includes(p)));
    } else {
      onChange([...new Set([...selected, ...keys])]);
    }
  }

  function toggleModule(module: PermissionModule) {
    const keys = getModulePermissionKeys(module);
    if (isModuleAllChecked(module)) {
      onChange(selected.filter(p => !keys.includes(p)));
    } else {
      onChange([...new Set([...selected, ...keys])]);
    }
  }

  return (
    <div className="space-y-1">
      {PERMISSION_MODULES.map(module => {
        const ModuleIcon = MODULE_ICONS[module.key] || Shield;
        const isExpanded = expandedModules.includes(module.key);
        const allChecked = isModuleAllChecked(module);
        const someChecked = isModuleSomeChecked(module);

        return (
          <div key={module.key} className="rounded-lg border border-border/50 overflow-hidden">
            <div
              className={cn(
                'flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors',
                'hover:bg-muted/50',
                someChecked && 'bg-primary/5'
              )}
              onClick={() => toggleExpand(module.key, expandedModules, setExpandedModules)}
            >
              <CustomCheck
                checked={allChecked}
                indeterminate={someChecked && !allChecked}
                onClick={(e) => { e.stopPropagation(); toggleModule(module); }}
              />
              <ModuleIcon className="w-4 h-4 text-muted-foreground" />
              <span className="font-semibold text-sm flex-1">{module.label}</span>
              <span className="text-xs text-muted-foreground mr-2">
                {getModulePermissionKeys(module).filter(k => selected.includes(k)).length}/{getModulePermissionKeys(module).length}
              </span>
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </div>

            {isExpanded && (
              <div className="border-t border-border/30">
                {module.resources.map(resource => {
                  const resExpanded = expandedResources.includes(`${module.key}.${resource.key}`);
                  const resAllChecked = isResourceAllChecked(module.key, resource);
                  const resSomeChecked = isResourceSomeChecked(module.key, resource);

                  return (
                    <div key={resource.key}>
                      <div
                        className={cn(
                          'flex items-center gap-3 pl-10 pr-4 py-2.5 cursor-pointer transition-colors',
                          'hover:bg-muted/30',
                          resSomeChecked && 'bg-primary/[0.03]'
                        )}
                        onClick={() => toggleExpand(`${module.key}.${resource.key}`, expandedResources, setExpandedResources)}
                      >
                        <CustomCheck
                          checked={resAllChecked}
                          indeterminate={resSomeChecked && !resAllChecked}
                          onClick={(e) => { e.stopPropagation(); toggleResource(module.key, resource); }}
                        />
                        <span className="text-sm font-medium flex-1">{resource.label}</span>
                        <span className="text-xs text-muted-foreground mr-2">
                          {getResourcePermissionKeys(module.key, resource).filter(k => selected.includes(k)).length}/{resource.actions.length}
                        </span>
                        {resExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                      </div>

                      {resExpanded && (
                        <div className="pl-16 pr-4 pb-2 space-y-1">
                          {resource.actions.map(action => {
                            const checked = isActionChecked(module.key, resource.key, action.key);
                            return (
                              <div
                                key={action.key}
                                className={cn(
                                  'flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors',
                                  'hover:bg-muted/40',
                                  checked && 'bg-primary/5'
                                )}
                                onClick={() => toggleAction(module.key, resource.key, action.key)}
                              >
                                <CustomCheck checked={checked} onClick={() => {}} />
                                <span className="text-sm">{action.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
