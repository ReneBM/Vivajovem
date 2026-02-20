import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
import Sidebar from './Sidebar';
import BirthdayNotification from './BirthdayNotification';
import SessionTimeout from '@/features/auth/components/SessionTimeout';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6 lg:p-8">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>
      <BirthdayNotification />
      <SessionTimeout />
    </div>
  );
}
