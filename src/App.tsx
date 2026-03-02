import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/features/auth/context/AuthContext";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import RoleGuard from "@/features/auth/components/RoleGuard";

// Pages
import Index from "./pages/Index";
import Auth from "@/features/auth/pages/LoginPage";
import Dashboard from "@/features/dashboard/pages/DashboardPage";
import Jovens from "@/features/jovens/pages/JovensPage";
import JovensVisitantes from "@/features/jovens/pages/VisitantesPage";
import Lideres from "@/features/lideres/pages/LideresPage";
import Grupos from "@/features/grupos/pages/GruposPage";
import Nucleos from "@/features/nucleos/pages/NucleosPage";
import Eventos from "@/features/eventos/pages/EventosPage";
import Campanhas from "@/features/campanhas/pages/CampanhasPage";
import InscricaoCampanha from "@/features/campanhas/pages/InscricaoPublicaPage";
import InscricaoEvento from "@/features/eventos/pages/InscricaoEventoPublicaPage";
import Relatorios from "@/features/relatorios/pages/RelatoriosPage";
import Configuracoes from "@/features/configuracoes/pages/ConfiguracoesPage";
import Aniversariantes from "@/features/jovens/pages/AniversariantesPage";
import Usuarios from "@/features/usuarios/pages/UsuariosPage";
import Marketing from "@/features/marketing/pages/MarketingPage";
import WhatsappManager from "@/features/whatsapp/pages/EvolutionManagerPage";
import Funcoes from "@/features/funcoes/pages/FuncoesPage";
import NotFound from "./pages/NotFound";

// Layout
import DashboardLayout from "./components/layout/DashboardLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />

            {/* Public inscription pages */}
            <Route path="/campanha/:slug" element={<ErrorBoundary><InscricaoCampanha /></ErrorBoundary>} />
            <Route path="/evento/:slug" element={<ErrorBoundary><InscricaoEvento /></ErrorBoundary>} />

            {/* Protected Routes */}
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/jovens" element={<RoleGuard requiredPermission="cadastro.jovens.visualizar"><Jovens /></RoleGuard>} />
              <Route path="/jovens-visitantes" element={<RoleGuard requiredPermission="cadastro.visitantes.visualizar"><JovensVisitantes /></RoleGuard>} />
              <Route path="/lideres" element={<RoleGuard requiredPermission="cadastro.lideres.visualizar"><Lideres /></RoleGuard>} />
              <Route path="/grupos" element={<RoleGuard requiredPermission="organizacao.grupos.visualizar"><Grupos /></RoleGuard>} />
              <Route path="/nucleos" element={<RoleGuard requiredPermission="organizacao.nucleos.visualizar"><Nucleos /></RoleGuard>} />
              <Route path="/eventos" element={<RoleGuard requiredPermission="eventos.eventos.visualizar"><Eventos /></RoleGuard>} />
              <Route path="/campanhas" element={<RoleGuard requiredPermission="marketing.campanhas.visualizar"><Campanhas /></RoleGuard>} />
              <Route path="/relatorios" element={<RoleGuard requiredPermission="relatorios.relatorios.visualizar"><Relatorios /></RoleGuard>} />
              <Route path="/configuracoes" element={<RoleGuard allowedRoles={['ADMIN']}><Configuracoes /></RoleGuard>} />
              <Route path="/aniversariantes" element={<RoleGuard requiredPermission="cadastro.jovens.visualizar"><Aniversariantes /></RoleGuard>} />
              <Route path="/usuarios" element={<RoleGuard requiredPermission="seguranca.usuarios.visualizar"><Usuarios /></RoleGuard>} />
              <Route path="/marketing" element={<RoleGuard requiredPermission="marketing.whatsapp.visualizar"><Marketing /></RoleGuard>} />
              <Route path="/whatsapp" element={<RoleGuard allowedRoles={['ADMIN']}><WhatsappManager /></RoleGuard>} />
              <Route path="/funcoes" element={<RoleGuard requiredPermission="seguranca.funcoes.visualizar"><Funcoes /></RoleGuard>} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
