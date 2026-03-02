import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { MessageCircle, Send, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { sendWhatsAppMessage, getWhatsAppConfig } from '@/features/marketing/services/whatsappService';
// We might need to import supabase if we want to log the message in whatsapp_mensagens table too
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';

interface BulkMessageModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    recipients: { id: string; nome: string; telefone: string }[];
    eventName: string;
}

export default function BulkMessageModal({ open, onOpenChange, recipients, eventName }: BulkMessageModalProps) {
    const { user } = useAuth();
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [cadencia, setCadencia] = useState(5);
    const [cadenciaMode, setCadenciaMode] = useState<'fixo' | 'variavel'>('fixo');
    const [cadenciaMin, setCadenciaMin] = useState(1);
    const [cadenciaMax, setCadenciaMax] = useState(30);

    async function handleSend() {
        if (!message.trim()) {
            toast.error('Digite uma mensagem');
            return;
        }

        const config = await getWhatsAppConfig();
        if (!config) {
            toast.error('WhatsApp não configurado. Vá em Configurações > APIs.');
            return;
        }

        setSending(true);
        setProgress({ current: 0, total: recipients.length });

        try {
            // Option: Create a record in whatsapp_mensagens for history
            const { data: msgLog, error: logErr } = await supabase.from('whatsapp_mensagens').insert({
                tipo: 'manual',
                destinatarios: recipients.map(r => r.telefone),
                mensagem: message,
                status: 'enviando',
                created_by: user?.id,
            } as any).select().single();

            let sent = 0;
            let failed = 0;
            const errors: string[] = [];

            for (const r of recipients) {
                const personalized = message
                    .replace(/{nome}/g, r.nome)
                    .replace(/{first_name}/g, r.nome.split(' ')[0])
                    .replace(/{evento}/g, eventName);

                const result = await sendWhatsAppMessage(config, r.telefone, personalized);

                if (result.success) sent++;
                else {
                    failed++;
                    errors.push(`${r.nome}: ${result.error}`);
                }

                setProgress(prev => ({ ...prev, current: prev.current + 1 }));
                // Cadência: fixa ou aleatória entre min e max
                const waitMs = cadenciaMode === 'variavel'
                    ? Math.floor(Math.random() * (cadenciaMax - cadenciaMin + 1) * 1000) + cadenciaMin * 1000
                    : cadencia * 1000;
                await new Promise(resolve => setTimeout(resolve, waitMs));
            }

            // Update log status
            if (msgLog) {
                const finalStatus = failed === recipients.length ? 'falha' : 'enviado';
                await supabase.from('whatsapp_mensagens').update({
                    status: finalStatus,
                    enviado_em: finalStatus === 'enviado' ? new Date().toISOString() : null,
                    erro: errors.length > 0 ? errors.join('; ') : null
                } as any).eq('id', (msgLog as any).id);
            }

            if (sent > 0) {
                toast.success(`${sent} mensagens enviadas!`);
                if (failed > 0) toast.warning(`${failed} falharam.`);
                onOpenChange(false);
                setMessage('');
            } else {
                toast.error('Nenhuma mensagem pôde ser enviada.');
            }

        } catch (error) {
            console.error('Error in bulk send:', error);
            toast.error('Erro ao processar envio em massa.');
        } finally {
            setSending(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-primary" />
                        Envio em Massa (WhatsApp)
                    </DialogTitle>
                    <DialogDescription>
                        Enviando para {recipients.length} participante(s) selecionado(s).
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>Mensagem</Label>
                            <div className="flex gap-1">
                                {['{nome}', '{first_name}', '{evento}'].map(tag => (
                                    <Badge key={tag} variant="secondary" className="text-[9px] px-1 py-0 cursor-default">
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                        <Textarea
                            placeholder="Digite sua mensagem... Use as tags acima para personalizar."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={5}
                            disabled={sending}
                        />
                    </div>

                    {/* Cadência */}
                    <div className="space-y-3 border rounded-lg p-3 bg-muted/20">
                        <div className="flex items-center justify-between">
                            <Label className="font-medium">Cadência entre envios</Label>
                            <div className="flex gap-1 bg-muted rounded-md p-0.5">
                                <button type="button"
                                    className={`px-2.5 py-1 text-xs rounded transition-colors ${cadenciaMode === 'fixo' ? 'bg-background shadow-sm font-semibold' : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    onClick={() => setCadenciaMode('fixo')}
                                    disabled={sending}
                                >Fixo</button>
                                <button type="button"
                                    className={`px-2.5 py-1 text-xs rounded transition-colors ${cadenciaMode === 'variavel' ? 'bg-background shadow-sm font-semibold' : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    onClick={() => setCadenciaMode('variavel')}
                                    disabled={sending}
                                >Variável</button>
                            </div>
                        </div>

                        {cadenciaMode === 'fixo' ? (
                            <>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-muted-foreground w-6">1s</span>
                                    <Slider
                                        value={[cadencia]}
                                        onValueChange={([v]) => setCadencia(v)}
                                        min={1} max={60} step={1} className="flex-1"
                                        disabled={sending}
                                    />
                                    <span className="text-xs text-muted-foreground w-8">60s</span>
                                    <Badge variant="outline" className="font-mono min-w-[3rem] justify-center">{cadencia}s</Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Intervalo fixo de <strong>{cadencia}s</strong> entre cada envio.
                                    {recipients.length > 0 && (
                                        <span> Tempo estimado: <strong>{Math.ceil(recipients.length * cadencia / 60)} min</strong></span>
                                    )}
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-muted-foreground w-12">Mínimo</span>
                                        <Slider
                                            value={[cadenciaMin]}
                                            onValueChange={([v]) => setCadenciaMin(Math.min(v, cadenciaMax - 1))}
                                            min={1} max={59} step={1} className="flex-1"
                                            disabled={sending}
                                        />
                                        <Badge variant="outline" className="font-mono min-w-[3rem] justify-center">{cadenciaMin}s</Badge>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-muted-foreground w-12">Máximo</span>
                                        <Slider
                                            value={[cadenciaMax]}
                                            onValueChange={([v]) => setCadenciaMax(Math.max(v, cadenciaMin + 1))}
                                            min={2} max={60} step={1} className="flex-1"
                                            disabled={sending}
                                        />
                                        <Badge variant="outline" className="font-mono min-w-[3rem] justify-center">{cadenciaMax}s</Badge>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Intervalo <strong>aleatório entre {cadenciaMin}s e {cadenciaMax}s</strong> para simular envio humano.
                                    {recipients.length > 0 && (
                                        <span> Tempo estimado: <strong>{Math.ceil(recipients.length * ((cadenciaMin + cadenciaMax) / 2) / 60)} min</strong></span>
                                    )}
                                </p>
                            </>
                        )}
                    </div>

                    {sending && (
                        <div className="space-y-2 animate-in fade-in">
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                <span>Enviando...</span>
                                <span>{progress.current} / {progress.total}</span>
                            </div>
                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary transition-all duration-300"
                                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
                        Cancelar
                    </Button>
                    <Button variant="hero" onClick={handleSend} disabled={sending || !message.trim()}>
                        {sending ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {progress.current}/{progress.total}</>
                        ) : (
                            <><Send className="w-4 h-4 mr-2" /> Enviar Agora</>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
