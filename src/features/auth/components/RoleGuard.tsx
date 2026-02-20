import { Navigate } from 'react-router-dom';
import { useUserRole, AppRole } from '@/features/auth/hooks/useUserRole';
import { usePermissions } from '@/hooks/usePermissions';
import { Loader2, ShieldX } from 'lucide-react';

interface RoleGuardProps {
    /** Roles permitidos para acessar o conteúdo (checagem simples) */
    allowedRoles?: AppRole[];
    /** Permissão necessária para acessar (checagem granular) */
    requiredPermission?: string;
    children: React.ReactNode;
    /** Se true, redireciona para /dashboard em vez de mostrar mensagem */
    redirect?: boolean;
}

export default function RoleGuard({ allowedRoles, requiredPermission, children, redirect = false }: RoleGuardProps) {
    const { role, loading: roleLoading } = useUserRole();
    const { hasPermission, isAdmin, loading: permLoading } = usePermissions();

    const loading = roleLoading || permLoading;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    // Admin sempre tem acesso total
    if (isAdmin) {
        return <>{children}</>;
    }

    // Verificar por permissão granular
    if (requiredPermission && !hasPermission(requiredPermission)) {
        if (redirect) return <Navigate to="/dashboard" replace />;
        return <AccessDenied />;
    }

    // Verificar por role simples
    if (allowedRoles && !allowedRoles.includes(role)) {
        if (redirect) return <Navigate to="/dashboard" replace />;
        return <AccessDenied />;
    }

    return <>{children}</>;
}

function AccessDenied() {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <ShieldX className="w-8 h-8 text-destructive" />
            </div>
            <div>
                <h2 className="text-xl font-semibold text-foreground mb-1">Acesso Restrito</h2>
                <p className="text-muted-foreground text-sm">
                    Você não tem permissão para acessar esta página.
                </p>
            </div>
        </div>
    );
}
