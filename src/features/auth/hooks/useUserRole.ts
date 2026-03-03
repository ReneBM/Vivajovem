import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'ADMIN' | 'LIDER' | 'USUARIO';

interface UseUserRoleReturn {
    role: AppRole;
    loading: boolean;
    isAdmin: boolean;
    isAdminOrLeader: boolean;
}

export function useUserRole(): UseUserRoleReturn {
    const { user } = useAuth();
    const [role, setRole] = useState<AppRole>('USUARIO');
    const [loading, setLoading] = useState(true);
    const lastUserId = useRef<string | null>(null);

    useEffect(() => {
        if (!user) {
            lastUserId.current = null;
            setRole('USUARIO');
            setLoading(false);
            return;
        }

        // Só marcar loading se é um user diferente ou primeira carga
        if (user.id !== lastUserId.current) {
            setLoading(true);
            lastUserId.current = user.id;
        }

        async function fetchRole() {
            try {
                const { data, error } = await supabase
                    .from('user_roles')
                    .select('role')
                    .eq('user_id', user!.id)
                    .single();

                if (!error && data) {
                    setRole(data.role as AppRole);
                }
            } catch {
                console.error('Erro ao buscar role do usuário');
            } finally {
                setLoading(false);
            }
        }

        fetchRole();
    }, [user]);

    return {
        role,
        loading,
        isAdmin: role === 'ADMIN',
        isAdminOrLeader: role === 'ADMIN' || role === 'LIDER',
    };
}
