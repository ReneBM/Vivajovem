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
import { Plus, Loader2 } from 'lucide-react';
import { TipoEvento, Grupo, Campanha, SituacaoEvento } from '@/types/app-types';

interface EventoFormData {
    titulo: string;
    descricao: string;
    data_evento: string;
    hora_evento: string;
    tipo: string;
    grupo_id: string;
    situacao: SituacaoEvento;
}

interface EventoFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    formData: EventoFormData;
    onFormChange: (data: EventoFormData) => void;
    tiposEvento: TipoEvento[];
    grupos: Grupo[];
    isEditing: boolean;
    isSubmitting: boolean;
    onSubmit: (e: React.FormEvent) => void;
    onReset: () => void;
}

export default function EventoFormDialog({
    open,
    onOpenChange,
    formData,
    onFormChange,
    tiposEvento,
    grupos,
    isEditing,
    isSubmitting,
    onSubmit,
    onReset,
}: EventoFormDialogProps) {
    const activeTipos = tiposEvento.filter(t => t.ativo);

    return (
        <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) onReset(); }}>
            <DialogTrigger asChild>
                <Button variant="hero">
                    <Plus className="w-4 h-4" />
                    Novo Evento
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="font-display">{isEditing ? 'Editar Evento' : 'Criar Evento'}</DialogTitle>
                    <DialogDescription>{isEditing ? 'Atualize os dados do evento' : 'Preencha os dados do novo evento'}</DialogDescription>
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Label>Título *</Label>
                        <Input value={formData.titulo} onChange={(e) => onFormChange({ ...formData, titulo: e.target.value })} placeholder="Ex: Culto de Jovens" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Data *</Label>
                            <Input type="date" value={formData.data_evento} onChange={(e) => onFormChange({ ...formData, data_evento: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                            <Label>Horário *</Label>
                            <Input type="time" value={formData.hora_evento} onChange={(e) => onFormChange({ ...formData, hora_evento: e.target.value })} required />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
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
                        <div className="space-y-2">
                            <Label>Grupo (opcional)</Label>
                            <Select value={formData.grupo_id} onValueChange={(v) => onFormChange({ ...formData, grupo_id: v === 'none' ? '' : v })}>
                                <SelectTrigger><SelectValue placeholder="Geral" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Geral (todos)</SelectItem>
                                    {grupos.map(g => (<SelectItem key={g.id} value={g.id}>{g.nome}</SelectItem>))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    {isEditing && (
                        <div className="space-y-2">
                            <Label>Situação do Evento</Label>
                            <Select value={formData.situacao} onValueChange={(v) => onFormChange({ ...formData, situacao: v as any })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="AGENDADO">Agendado</SelectItem>
                                    <SelectItem value="REALIZADO">Realizado</SelectItem>
                                    <SelectItem value="CANCELADO">Cancelado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label>Descrição</Label>
                        <Textarea value={formData.descricao} onChange={(e) => onFormChange({ ...formData, descricao: e.target.value })} placeholder="Detalhes do evento" rows={3} />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => { onOpenChange(false); onReset(); }}>Cancelar</Button>
                        <Button type="submit" variant="hero" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : isEditing ? 'Atualizar' : 'Criar Evento'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
