import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Plus,
    MessageCircle,
    RefreshCw,
    Trash2,
    Smartphone,
    Settings2,
    AlertCircle,
    CheckCircle2,
    Clock
} from 'lucide-react';
import { WhatsAppRepository } from '../repositories/whatsapp.repository';
import { WhatsAppService } from '../services/whatsapp.service';
import { WhatsAppInstance } from '../types/whatsapp.types';
import ConnectionModal from '../components/ConnectionModal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function EvolutionManagerPage() {
    const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
    const [loading, setLoading] = useState(true);
    const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
    const [config, setConfig] = useState<{ apiUrl: string; apiKey: string } | null>(null);

    const repository = new WhatsAppRepository();

    async function fetchConfig() {
        const { data, error } = await supabase
            .from('api_configurations')
            .select('configuracao')
            .eq('tipo', 'whatsapp')
            .single();

        if (error || !data) {
            toast.error('Configure a Evolution API primeiro em Configurações > APIs');
            return;
        }

        const conf = data.configuracao as any;
        setConfig({
            apiUrl: conf.api_url,
            apiKey: conf.api_key
        });
    }

    async function fetchData() {
        setLoading(true);
        try {
            await fetchConfig();
            const data = await repository.getInstances();
            setInstances(data);
        } catch (error) {
            console.error(error);
            toast.error('Falha ao carregar instâncias');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
    }, []);

    async function handleDelete(instance: WhatsAppInstance) {
        if (!confirm(`Tem certeza que deseja remover a instância "${instance.name}"?`)) return;

        try {
            if (config) {
                const service = new WhatsAppService(config);
                await service.deleteInstance(instance.name);
            }
            await repository.deleteInstance(instance.id);
            toast.success('Instância removida com sucesso');
            fetchData();
        } catch (error: any) {
            toast.error('Erro ao remover: ' + error.message);
        }
    }

    const getStatusBadge = (status: WhatsAppInstance['status']) => {
        switch (status) {
            case 'connected':
                return <Badge className="bg-success/10 text-success hover:bg-success/20 border-success/20 gap-1"><CheckCircle2 className="w-3 h-3" /> Conectado</Badge>;
            case 'qr_ready':
                return <Badge variant="outline" className="text-warning border-warning/20 bg-warning/5 gap-1"><Smartphone className="w-3 h-3" /> QR Pendente</Badge>;
            default:
                return <Badge variant="secondary" className="gap-1"><AlertCircle className="w-3 h-3" /> Desconectado</Badge>;
        }
    };

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-display font-bold text-foreground">Gestor de WhatsApp</h1>
                    <p className="text-muted-foreground mt-1">Conecte e gerencie suas instâncias da Evolution API.</p>
                </div>
                <Button onClick={() => setIsConnectModalOpen(true)} className="gap-2 shadow-lg shadow-primary/20">
                    <Plus className="w-4 h-4" /> Nova Conexão
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i} className="glass-card animate-pulse">
                            <div className="h-48 bg-muted/20" />
                        </Card>
                    ))
                ) : instances.length === 0 ? (
                    <Card className="col-span-full py-12 border-dashed bg-muted/5">
                        <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                                <MessageCircle className="w-8 h-8 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold">Nenhuma instância encontrada</h3>
                                <p className="text-sm text-muted-foreground">Clique em "Nova Conexão" para começar a enviar mensagens.</p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    instances.map((instance) => (
                        <Card key={instance.id} className="glass-card group overflow-hidden hover:border-primary/50 transition-all duration-300">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <CardTitle className="flex items-center gap-2">
                                            <Smartphone className="w-5 h-5 text-primary" />
                                            {instance.name}
                                        </CardTitle>
                                        <CardDescription>{instance.status === 'connected' ? 'Ativa e pronta para uso' : 'Aguardando ação'}</CardDescription>
                                    </div>
                                    {getStatusBadge(instance.status)}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2 py-2 border-y border-border/50">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">Última atividade:</span>
                                        <span className="font-medium flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> {instance.last_seen ? new Date(instance.last_seen).toLocaleString() : 'Nunca'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">Configurada em:</span>
                                        <span>{new Date(instance.created_at!).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    {instance.status !== 'connected' && (
                                        <Button variant="outline" className="flex-1 text-xs" onClick={() => setIsConnectModalOpen(true)}>
                                            <RefreshCw className="w-3 h-3 mr-2" /> Reconectar
                                        </Button>
                                    )}
                                    {instance.status === 'connected' && (
                                        <Button variant="outline" className="flex-1 text-xs">
                                            <Settings2 className="w-3 h-3 mr-2" /> Configurar
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-destructive hover:bg-destructive/10"
                                        onClick={() => handleDelete(instance)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {config && (
                <ConnectionModal
                    open={isConnectModalOpen}
                    onOpenChange={setIsConnectModalOpen}
                    onSuccess={fetchData}
                    config={config}
                />
            )}
        </div>
    );
}
