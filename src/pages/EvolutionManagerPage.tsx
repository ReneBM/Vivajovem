import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EvolutionManagerPage() {
    const [managerUrl, setManagerUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchConfig() {
            try {
                // Check if user is authenticated first (for diagnostic)
                const { data: { session } } = await supabase.auth.getSession();

                const { data, error: dbError } = await supabase
                    .from('api_configurations')
                    .select('configuracao')
                    .eq('tipo', 'whatsapp')
                    .maybeSingle();

                if (dbError) {
                    setError(`Erro de Banco de Dados: ${dbError.message}`);
                    return;
                }

                if (!data) {
                    if (!session) {
                        setError('Acesso negado. Você precisa estar logado ou aplicar a política de RLS pública (SQL) que enviei anteriormente.');
                    } else {
                        setError('A configuração do WhatsApp não foi encontrada no banco. Vá em "Configurações > APIs" e salve os dados da Evolution API primeiro.');
                    }
                    return;
                }

                const config = data.configuracao as any;
                if (!config || !config.api_url) {
                    setError('A URL da API não foi definida nas configurações do WhatsApp.');
                    return;
                }

                // Evolution API Dashboard resides at /manager
                let baseUrl = config.api_url.replace(/\/$/, '');
                setManagerUrl(`${baseUrl}/manager`);
            } catch (err) {
                console.error('Error fetching manager config:', err);
                setError('Erro inesperado ao carregar configurações.');
            } finally {
                setLoading(false);
            }
        }

        fetchConfig();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background">
                <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground animate-pulse">Carregando Evolution Manager...</p>
            </div>
        );
    }

    if (error || !managerUrl) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center">
                <AlertCircle className="w-12 h-12 text-destructive mb-4" />
                <h2 className="text-xl font-bold mb-2">Ops! Algo deu errado</h2>
                <p className="text-muted-foreground mb-6 max-w-md">{error}</p>
                <Button onClick={() => window.location.href = '/'}>
                    Voltar ao Início
                </Button>
            </div>
        );
    }

    return (
        <div className="w-full h-screen flex flex-col bg-background">
            <div className="bg-primary/10 p-2 flex items-center justify-between border-b px-4">
                <div className="flex items-center gap-2 text-sm text-foreground/80">
                    <AlertCircle className="w-4 h-4 text-primary" />
                    <span>Se o painel abaixo estiver em branco, pode ser um bloqueio de segurança do navegador.</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => window.open(managerUrl, '_blank')}>
                    Abrir em Nova Aba
                </Button>
            </div>
            <div className="flex-1 overflow-hidden relative">
                <iframe
                    src={managerUrl}
                    className="w-full h-full border-none"
                    title="Evolution API Manager"
                    allow="camera; microphone; clipboard-read; clipboard-write; display-capture"
                />
            </div>
        </div>
    );
}
