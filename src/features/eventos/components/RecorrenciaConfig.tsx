import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Calendar, Repeat, Info } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    type RecorrenciaConfig as RecorrenciaConfigType,
    type TipoRecorrencia,
    generateRecurringDates,
    describeRecurrence,
    getWeekdayName,
    getPosicaoName,
} from '@/features/eventos/utils/recurrence-utils';

interface RecorrenciaConfigProps {
    config: RecorrenciaConfigType;
    onChange: (config: RecorrenciaConfigType) => void;
}

const TIPO_LABELS: Record<TipoRecorrencia, string> = {
    SEMANAL: 'Semanal (ex: toda sexta)',
    INTERVALO_DIAS: 'A cada X dias',
    MENSAL_POSICAO: 'Mensal por posição (ex: 1ª sexta)',
    MENSAL_DIA: 'Mensal por dia (ex: todo dia 15)',
};

export function RecorrenciaConfig({ config, onChange }: RecorrenciaConfigProps) {
    const [preview, setPreview] = useState<Date[]>([]);

    useEffect(() => {
        try {
            const dates = generateRecurringDates(config);
            setPreview(dates.slice(0, 6));
        } catch {
            setPreview([]);
        }
    }, [config]);

    function updateField<K extends keyof RecorrenciaConfigType>(key: K, value: RecorrenciaConfigType[K]) {
        onChange({ ...config, [key]: value });
    }

    return (
        <div className="space-y-4">
            {/* Tipo de recorrência */}
            <div className="space-y-2">
                <Label className="flex items-center gap-2">
                    <Repeat className="w-4 h-4 text-primary" />
                    Tipo de recorrência
                </Label>
                <Select
                    value={config.tipo_recorrencia}
                    onValueChange={(v) => updateField('tipo_recorrencia', v as TipoRecorrencia)}
                >
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {(Object.keys(TIPO_LABELS) as TipoRecorrencia[]).map((tipo) => (
                            <SelectItem key={tipo} value={tipo}>
                                {TIPO_LABELS[tipo]}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Campos dinâmicos por tipo */}
            {config.tipo_recorrencia === 'SEMANAL' && (
                <div className="space-y-2">
                    <Label>Dia da semana</Label>
                    <Select
                        value={String(config.dia_semana ?? 5)}
                        onValueChange={(v) => updateField('dia_semana', parseInt(v))}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                                <SelectItem key={d} value={String(d)}>
                                    {getWeekdayName(d)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {config.tipo_recorrencia === 'INTERVALO_DIAS' && (
                <div className="space-y-2">
                    <Label>A cada quantos dias?</Label>
                    <Input
                        type="number"
                        min={1}
                        max={365}
                        value={config.intervalo_dias ?? 7}
                        onChange={(e) => updateField('intervalo_dias', parseInt(e.target.value) || 7)}
                    />
                </div>
            )}

            {config.tipo_recorrencia === 'MENSAL_POSICAO' && (
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Posição</Label>
                        <Select
                            value={String(config.posicao_no_mes ?? 1)}
                            onValueChange={(v) => updateField('posicao_no_mes', parseInt(v))}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {[1, 2, 3, 4, 5].map((p) => (
                                    <SelectItem key={p} value={String(p)}>
                                        {getPosicaoName(p)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Dia da semana</Label>
                        <Select
                            value={String(config.dia_semana ?? 5)}
                            onValueChange={(v) => updateField('dia_semana', parseInt(v))}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                                    <SelectItem key={d} value={String(d)}>
                                        {getWeekdayName(d)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}

            {config.tipo_recorrencia === 'MENSAL_DIA' && (
                <div className="space-y-2">
                    <Label>Dia do mês</Label>
                    <Input
                        type="number"
                        min={1}
                        max={31}
                        value={config.dia_do_mes ?? 1}
                        onChange={(e) => updateField('dia_do_mes', parseInt(e.target.value) || 1)}
                    />
                </div>
            )}

            {/* Período */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Data de início *</Label>
                    <Input
                        type="date"
                        value={config.data_inicio}
                        onChange={(e) => updateField('data_inicio', e.target.value)}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label>Data de término</Label>
                    <Input
                        type="date"
                        value={config.data_fim || ''}
                        onChange={(e) => updateField('data_fim', e.target.value || null)}
                    />
                    <p className="text-xs text-muted-foreground">Vazio = até o fim do ano</p>
                </div>
            </div>

            {/* Descrição da regra */}
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2 text-sm font-medium text-primary mb-1">
                    <Info className="w-4 h-4" />
                    Resumo
                </div>
                <p className="text-sm text-foreground">{describeRecurrence(config)}</p>
            </div>

            {/* Preview */}
            {preview.length > 0 && (
                <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        Próximos eventos ({preview.length > 5 ? '6+' : preview.length})
                    </Label>
                    <div className="flex flex-wrap gap-2">
                        {preview.map((date, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                                {format(date, "dd/MM (EEE)", { locale: ptBR })}
                            </Badge>
                        ))}
                        {preview.length >= 6 && (
                            <Badge variant="outline" className="text-xs text-muted-foreground">
                                ...
                            </Badge>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
