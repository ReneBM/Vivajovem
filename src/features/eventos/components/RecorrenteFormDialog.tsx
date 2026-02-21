import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Repeat, Loader2 } from 'lucide-react';
import { RecorrenciaConfig } from '@/features/eventos/components/RecorrenciaConfig';
import { type RecorrenciaConfig as RecorrenciaConfigType } from '@/features/eventos/utils/recurrence-utils';


import { TipoEvento, Grupo, Campanha } from '@/types/app-types';

interface RecFormData {
    titulo: string;
    descricao: string;
    hora_evento: string;
    tipo: string;
    grupo_id: string;
}

interface RecorrenteFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    formData: RecFormData;
    onFormChange: (data: RecFormData) => void;
    recConfig: RecorrenciaConfigType;
    onRecConfigChange: (config: RecorrenciaConfigType) => void;
    tiposEvento: TipoEvento[];
    grupos: Grupo[];
    isSubmitting: boolean;
    onSubmit: (e: React.FormEvent) => void;
    onReset: () => void;
}

export default function RecorrenteFormDialog({
    open,
    onOpenChange,
    formData,
    onFormChange,
    recConfig,
    onRecConfigChange,
    tiposEvento,
    grupos,
    isSubmitting,
    onSubmit,
    onReset,
}: RecorrenteFormDialogProps) {
    const activeTipos = tiposEvento.filter(t => t.ativo);

    return (
        <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) onReset(); }}>
            <DialogTrigger asChild>
                <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary/10">
                    <Repeat className="w-4 h-4" />
                    Recorrente
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="font-display flex items-center gap-2">
                        <Repeat className="w-5 h-5 text-primary" />
                        Evento Recorrente
                    </DialogTitle>
                    <DialogDescription>
                        Configure um evento que se repete automaticamente no calendário
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Label>Título *</Label>
                        <Input
                            value={formData.titulo}
                            onChange={(e) => onFormChange({ ...formData, titulo: e.target.value })}
                            placeholder="Ex: Culto de Jovens"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Horário *</Label>
                            <Input type="time" value={formData.hora_evento} onChange={(e) => onFormChange({ ...formData, hora_evento: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                            <Label>Tipo</Label>
                            <Select value={formData.tipo} onValueChange={(v) => onFormChange({ ...formData, tipo: v })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    {activeTipos.map(t => (
                                        <SelectItem key={t.id} value={t.nome}>
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.cor }} />
                                                {t.nome}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Grupo (opcional)</Label>
                        <Select value={formData.grupo_id} onValueChange={(v) => onFormChange({ ...formData, grupo_id: v === 'none' ? '' : v })}>
                            <SelectTrigger><SelectValue placeholder="Geral (todos)" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Geral (todos)</SelectItem>
                                {grupos.map(g => (<SelectItem key={g.id} value={g.id}>{g.nome}</SelectItem>))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="border-t border-border pt-4">
                        <RecorrenciaConfig config={recConfig} onChange={onRecConfigChange} />
                    </div>
                    <div className="space-y-2">
                        <Label>Descrição</Label>
                        <Textarea value={formData.descricao} onChange={(e) => onFormChange({ ...formData, descricao: e.target.value })} placeholder="Detalhes do evento (opcional)" rows={2} />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => { onOpenChange(false); onReset(); }}>Cancelar</Button>
                        <Button type="submit" variant="hero" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar Eventos'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
