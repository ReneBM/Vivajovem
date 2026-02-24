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
                const { data, error: dbError } = await supabase
                    .from('api_configurations')
                    .select('configuracao')
                    .eq('tipo', 'whatsapp')
                    .single();

                if (dbError || !data) {
                    setError('Configuração do WhatsApp não encontrada.');
                    return;
                }

                const config = data.configuracao as any;
                if (!config.api_url) {
                    setError('URL da API não configurada.');
                    return;
                }

                // Evolution API Dashboard usually resides at /manager on the same API URL
                // Let's ensure it's a valid URL and add /manager if not present
                let baseUrl = config.api_url.replace(/\/$/, '');
                setManagerUrl(`${baseUrl}/manager`);
            } catch (err) {
                console.error('Error fetching manager config:', err);
                setError('Erro ao carregar configurações.');
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
        <div className="w-full h-screen overflow-hidden bg-background">
            <iframe
                src={managerUrl}
                className="w-full h-full border-none"
                title="Evolution API Manager"
                allow="camera; microphone; clipboard-read; clipboard-write; display-capture"
            />
        </div>
    );
}
