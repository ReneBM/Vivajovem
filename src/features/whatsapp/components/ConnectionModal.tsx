import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, QrCode, CheckCircle2, AlertCircle } from 'lucide-react';
import { WhatsAppService } from '../services/whatsapp.service';
import { WhatsAppRepository } from '../repositories/whatsapp.repository';
import { useAuth } from '@/features/auth/context/AuthContext';
import { toast } from 'sonner';

interface ConnectionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    config: { apiUrl: string; apiKey: string };
}

export default function ConnectionModal({ open, onOpenChange, onSuccess, config }: ConnectionModalProps) {
    const { user } = useAuth();
    const [instanceName, setInstanceName] = useState('');
    const [status, setStatus] = useState<'idle' | 'creating' | 'pairing' | 'success' | 'error'>('idle');
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [savedInstanceId, setSavedInstanceId] = useState<string | null>(null);

    const service = new WhatsAppService(config);
    const repository = new WhatsAppRepository();

    // Reset state when modal opens/closes
    useEffect(() => {
        if (!open) {
            setInstanceName('');
            setStatus('idle');
            setQrCode(null);
            setError(null);
            setSavedInstanceId(null);
        }
    }, [open]);

    async function handleCreate() {
        if (!instanceName.trim()) {
            toast.error('Informe um nome para a instância');
            return;
        }

        if (!user) {
            toast.error('Usuário não autenticado');
            return;
        }

        setStatus('creating');
        setError(null);

        try {
            // 1. Criar na Evolution API
            const result = await service.createInstance(instanceName);
            console.log('Resultado createInstance:', result);

            // 2. Salvar no Supabase
            const newInstance = await repository.saveInstance({
                name: instanceName,
                token: result?.hash?.apikey || result?.token || '',
                instance_key: result?.instance?.instanceId || result?.instanceId || '',
                status: 'qr_ready',
                owner_id: user.id
            });
            setSavedInstanceId(newInstance.id);

            // 3. Buscar QR Code via endpoint connect
            const qrResult = await service.getQRCode(instanceName);
            console.log('Resultado getQRCode:', qrResult);

            // O QR pode vir em diferentes formatos na v2
            const base64QR = qrResult?.base64 || qrResult?.qrcode?.base64 || qrResult?.code;
            if (base64QR) {
                setQrCode(base64QR);
                setStatus('pairing');
            } else {
                // Se não veio QR, pode ser que já está conectado
                setStatus('success');
                await repository.updateInstance(newInstance.id, { status: 'connected' });
                toast.success('Instância conectada!');
                onSuccess();
                setTimeout(() => onOpenChange(false), 2000);
            }

        } catch (err: any) {
            console.error(err);
            setError(err.message);
            setStatus('error');
        }
    }

    // Polling para verificar se o QR foi escaneado
    useEffect(() => {
        let interval: any;
        if (status === 'pairing') {
            interval = setInterval(async () => {
                try {
                    const state = await service.getConnectionStatus(instanceName);
                    console.log('Polling status:', state);

                    // Evolution API v2 retorna instance.state OU connectionStatus
                    const connectionState = state?.instance?.state || state?.connectionStatus || state?.state;

                    if (connectionState === 'open') {
                        setStatus('success');
                        clearInterval(interval);

                        // Atualizar status no banco
                        if (savedInstanceId) {
                            await repository.updateInstance(savedInstanceId, {
                                status: 'connected',
                                last_seen: new Date().toISOString()
                            });
                        }

                        toast.success('WhatsApp conectado com sucesso!');
                        onSuccess();
                        setTimeout(() => onOpenChange(false), 2000);
                    }
                } catch (e) {
                    console.log('Polling erro (normal):', e);
                }
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [status, instanceName, savedInstanceId]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Conectar WhatsApp</DialogTitle>
                    <DialogDescription>
                        Siga os passos abaixo para vincular seu WhatsApp ao sistema.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6 flex flex-col items-center justify-center space-y-4">
                    {status === 'idle' && (
                        <div className="w-full space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome da Instância (ex: Financeiro)</Label>
                                <Input
                                    id="name"
                                    placeholder="Nome identificador"
                                    value={instanceName}
                                    onChange={(e) => setInstanceName(e.target.value)}
                                />
                            </div>
                            <Button className="w-full" onClick={handleCreate}>
                                Gerar QR Code
                            </Button>
                        </div>
                    )}

                    {status === 'creating' && (
                        <div className="flex flex-col items-center py-8">
                            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                            <p className="text-sm text-muted-foreground">Iniciando instância...</p>
                        </div>
                    )}

                    {status === 'pairing' && qrCode && (
                        <div className="flex flex-col items-center space-y-4">
                            <div className="p-4 bg-white rounded-xl shadow-inner">
                                <img src={qrCode} alt="QR Code WhatsApp" className="w-64 h-64" />
                            </div>
                            <div className="text-center">
                                <p className="font-semibold flex items-center justify-center gap-2">
                                    <QrCode className="w-4 h-4" /> Escaneie agora
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Abra o WhatsApp {'>'} Configurações {'>'} Dispositivos Conectados
                                </p>
                                <p className="text-xs text-muted-foreground mt-2 animate-pulse">
                                    Aguardando leitura do QR Code...
                                </p>
                            </div>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="flex flex-col items-center py-8 text-center animate-in zoom-in-50">
                            <CheckCircle2 className="w-16 h-16 text-success mb-4" />
                            <h3 className="text-lg font-bold">Conectado com sucesso!</h3>
                            <p className="text-sm text-muted-foreground">Sua instância "{instanceName}" já está ativa.</p>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="flex flex-col items-center py-8 text-center">
                            <AlertCircle className="w-12 h-12 text-destructive mb-4" />
                            <h3 className="font-semibold">Erro na conexão</h3>
                            <p className="text-sm text-muted-foreground mb-4">{error}</p>
                            <Button variant="outline" onClick={() => setStatus('idle')}>Tentar novamente</Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
