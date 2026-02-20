import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { toast } from 'sonner';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

/** Tempo de inatividade em minutos antes do aviso */
const INACTIVITY_MINUTES = 30;
/** Tempo em segundos para o countdown antes de deslogar */
const WARNING_SECONDS = 60;

const INACTIVITY_MS = INACTIVITY_MINUTES * 60 * 1000;
const EVENTS = ['mousedown', 'keydown', 'touchstart', 'scroll'] as const;

export default function SessionTimeout() {
    const { signOut, user } = useAuth();
    const [showWarning, setShowWarning] = useState(false);
    const [countdown, setCountdown] = useState(WARNING_SECONDS);
    const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

    const clearTimers = useCallback(() => {
        if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
        if (countdownTimer.current) clearInterval(countdownTimer.current);
    }, []);

    const handleLogout = useCallback(async () => {
        clearTimers();
        setShowWarning(false);
        toast.info('Sessão encerrada por inatividade');
        await signOut();
    }, [signOut, clearTimers]);

    const startWarningCountdown = useCallback(() => {
        setShowWarning(true);
        setCountdown(WARNING_SECONDS);

        countdownTimer.current = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    handleLogout();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, [handleLogout]);

    const resetTimer = useCallback(() => {
        clearTimers();
        setShowWarning(false);
        setCountdown(WARNING_SECONDS);

        inactivityTimer.current = setTimeout(() => {
            startWarningCountdown();
        }, INACTIVITY_MS);
    }, [clearTimers, startWarningCountdown]);

    const handleStayActive = () => {
        resetTimer();
    };

    useEffect(() => {
        if (!user) return;

        // Iniciar timer
        resetTimer();

        // Atividade do usuário reseta o timer
        const handleActivity = () => {
            if (!showWarning) {
                resetTimer();
            }
        };

        EVENTS.forEach((event) => document.addEventListener(event, handleActivity));

        return () => {
            clearTimers();
            EVENTS.forEach((event) => document.removeEventListener(event, handleActivity));
        };
    }, [user, showWarning, resetTimer, clearTimers]);

    if (!user) return null;

    return (
        <AlertDialog open={showWarning}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Sessão prestes a expirar</AlertDialogTitle>
                    <AlertDialogDescription>
                        Você está inativo há {INACTIVITY_MINUTES} minutos. Sua sessão será
                        encerrada em <strong>{countdown}s</strong>. Clique abaixo para
                        continuar conectado.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction onClick={handleStayActive}>
                        Continuar conectado
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
