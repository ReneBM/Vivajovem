import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Plus,
    Loader2,
    Link as LinkIcon,
    Trash2,
    Palette,
    Image,
    Upload,
    X,
    Type,
    User,
    Phone,
    Mail,
    Calendar,
    Church,
    MapPin,
    Heart,
    Instagram,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

// Icons map for the fields
const ICON_MAP: Record<string, React.ReactNode> = {
    user: <User className="w-4 h-4" />,
    phone: <Phone className="w-4 h-4" />,
    mail: <Mail className="w-4 h-4" />,
    calendar: <Calendar className="w-4 h-4" />,
    church: <Church className="w-4 h-4" />,
    instagram: <Instagram className="w-4 h-4" />,
    mappin: <MapPin className="w-4 h-4" />,
    heart: <Heart className="w-4 h-4" />,
};

import { FieldConfig, Evento, EventoRecorrente } from '@/types/app-types';

interface InscricaoFormData {
    titulo: string;
    descricao: string;
    slug: string;
    evento_id: string;
    cor_primaria: string;
    cor_fundo: string;
    imagem_capa_url: string;
    imagem_titulo_url: string;
    max_vagas: string;
    data_limite: string;
    recorrente_id: string;
    ativa: boolean;
}

interface InscricaoFormStepsProps {
    formStep: number;
    setFormStep: (step: number) => void;
    formData: InscricaoFormData;
    setFormData: React.Dispatch<React.SetStateAction<InscricaoFormData>>;
    campos: FieldConfig[];
    eventos: Evento[];
    recorrentes: EventoRecorrente[];
    isEditing: boolean;
    isSubmitting: boolean;
    uploadingCapa: boolean;
    uploadingTitulo: boolean;
    customFieldLabel: string;
    setCustomFieldLabel: (label: string) => void;
    // Handlers
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
    onCapaUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onCapaRemove: () => void;
    onTituloUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onTituloRemove: () => void;
    onToggleField: (id: string) => void;
    onToggleRequired: (id: string) => void;
    onAddCustomField: () => void;
    onRemoveCustomField: (id: string) => void;
    generateSlug: (titulo: string) => string;
}

export default function InscricaoFormSteps({
    formStep,
    setFormStep,
    formData,
    setFormData,
    campos,
    eventos,
    recorrentes,
    isEditing,
    isSubmitting,
    uploadingCapa,
    uploadingTitulo,
    customFieldLabel,
    setCustomFieldLabel,
    onSubmit,
    onCancel,
    onCapaUpload,
    onCapaRemove,
    onTituloUpload,
    onTituloRemove,
    onToggleField,
    onToggleRequired,
    onAddCustomField,
    onRemoveCustomField,
    generateSlug,
}: InscricaoFormStepsProps) {
    const capaInputRef = useRef<HTMLInputElement>(null);
    const tituloInputRef = useRef<HTMLInputElement>(null);

    return (
        <form onSubmit={onSubmit} className="space-y-4">
            {formStep === 0 && (
                <>
                    <div className="space-y-2">
                        <Label>Título *</Label>
                        <Input
                            value={formData.titulo}
                            onChange={(e) => {
                                const titulo = e.target.value;
                                setFormData(prev => ({
                                    ...prev,
                                    titulo,
                                    slug: isEditing ? prev.slug : generateSlug(titulo)
                                }));
                            }}
                            placeholder="Ex: Retiro de Jovens 2026"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2"><LinkIcon className="w-4 h-4" /> Slug (URL)</Label>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground whitespace-nowrap">/evento/</span>
                            <Input
                                value={formData.slug}
                                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                                placeholder="retiro-2026"
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
                        <Label className="text-primary font-semibold">Vínculo do Evento</Label>

                        <div className="space-y-2">
                            <Label className="text-xs">Vincular a um Evento Específico</Label>
                            <Select
                                value={formData.evento_id || 'none'}
                                onValueChange={(v) => {
                                    setFormData(prev => ({ ...prev, evento_id: v === 'none' ? '' : v, recorrente_id: '' }));
                                }}
                            >
                                <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Nenhum</SelectItem>
                                    {eventos.map(e => (
                                        <SelectItem key={e.id} value={e.id}>
                                            {e.titulo} — {format(parseISO(e.data_evento), 'dd/MM/yyyy')}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="relative flex items-center py-2">
                            <div className="flex-grow border-t border-border/50"></div>
                            <span className="flex-shrink mx-4 text-[10px] text-muted-foreground uppercase tracking-widest">OU</span>
                            <div className="flex-grow border-t border-border/50"></div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs">Vincular a uma Regra Recorrente (Ex: Todo Domingo)</Label>
                            <Select
                                value={formData.recorrente_id || 'none'}
                                onValueChange={(v) => {
                                    setFormData(prev => ({ ...prev, recorrente_id: v === 'none' ? '' : v, evento_id: '' }));
                                }}
                            >
                                <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Nenhuma</SelectItem>
                                    {recorrentes.map(r => (
                                        <SelectItem key={r.id} value={r.id}>
                                            {r.titulo} (Recorrente)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-[10px] text-muted-foreground">
                                Ao vincular a uma recorrência, a inscrição aparecerá em todos os eventos gerados por esta regra.
                            </p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Descrição</Label>
                        <Textarea value={formData.descricao} onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))} placeholder="Detalhes que aparecerão na página de inscrição" rows={3} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Máx. vagas (vazio = ilimitado)</Label>
                            <Input type="number" min={1} value={formData.max_vagas} onChange={(e) => setFormData(prev => ({ ...prev, max_vagas: e.target.value }))} placeholder="100" />
                        </div>
                        <div className="space-y-2">
                            <Label>Data limite</Label>
                            <Input type="datetime-local" value={formData.data_limite} onChange={(e) => setFormData(prev => ({ ...prev, data_limite: e.target.value }))} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2"><Palette className="w-4 h-4" /> Cor primária</Label>
                            <div className="flex items-center gap-2">
                                <input type="color" value={formData.cor_primaria} onChange={(e) => setFormData(prev => ({ ...prev, cor_primaria: e.target.value }))} className="w-10 h-10 rounded-lg cursor-pointer border border-border" />
                                <Input value={formData.cor_primaria} onChange={(e) => setFormData(prev => ({ ...prev, cor_primaria: e.target.value }))} className="font-mono" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2"><Palette className="w-4 h-4" /> Cor de fundo</Label>
                            <div className="flex items-center gap-2">
                                <input type="color" value={formData.cor_fundo} onChange={(e) => setFormData(prev => ({ ...prev, cor_fundo: e.target.value }))} className="w-10 h-10 rounded-lg cursor-pointer border border-border" />
                                <Input value={formData.cor_fundo} onChange={(e) => setFormData(prev => ({ ...prev, cor_fundo: e.target.value }))} className="font-mono" />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2"><Image className="w-4 h-4" /> Imagem de capa</Label>
                        <input ref={capaInputRef} type="file" accept="image/*" onChange={onCapaUpload} className="hidden" />
                        {formData.imagem_capa_url ? (
                            <div className="relative rounded-lg overflow-hidden border border-border">
                                <img src={formData.imagem_capa_url} alt="Capa" className="w-full h-36 object-cover" />
                                <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7 rounded-full" onClick={onCapaRemove}>
                                    <X className="h-3 h-3" />
                                </Button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => capaInputRef.current?.click()}
                                disabled={uploadingCapa}
                                className="w-full h-36 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors cursor-pointer disabled:opacity-50"
                            >
                                {uploadingCapa ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    <>
                                        <Upload className="w-6 h-6" />
                                        <span className="text-sm">Clique para enviar imagem de capa</span>
                                        <span className="text-xs">JPEG, PNG ou WebP • Máx. 5MB • Recomendado: 1200×400px</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2"><Type className="w-4 h-4" /> Imagem do título (PNG transparente)</Label>
                        <input ref={tituloInputRef} type="file" accept="image/png,image/webp" onChange={onTituloUpload} className="hidden" />
                        {formData.imagem_titulo_url ? (
                            <div className="relative rounded-lg overflow-hidden border border-border bg-[#1a1a1a] flex items-center justify-center p-4">
                                <img src={formData.imagem_titulo_url} alt="Título" className="max-h-20 object-contain" />
                                <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7 rounded-full" onClick={onTituloRemove}>
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => tituloInputRef.current?.click()}
                                disabled={uploadingTitulo}
                                className="w-full h-24 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors cursor-pointer disabled:opacity-50"
                            >
                                {uploadingTitulo ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <Type className="w-5 h-5" />
                                        <span className="text-xs">PNG com fundo transparente • Máx. 5MB • Recomendado: 600×200px</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
                        <Button type="button" variant="hero" onClick={() => setFormStep(1)}>Próximo: Campos</Button>
                    </div>
                </>
            )}

            {formStep === 1 && (
                <>
                    <div className="space-y-3">
                        {campos.map(field => (
                            <div key={field.id} className={`flex items-center justify-between p-3 rounded-lg border transition-all ${field.enabled ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 border-border/50 opacity-60'}`}>
                                <div className="flex items-center gap-3">
                                    <Checkbox
                                        checked={field.enabled}
                                        onCheckedChange={() => onToggleField(field.id)}
                                        disabled={field.id === 'nome'}
                                    />
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        {ICON_MAP[field.icon || 'heart']}
                                    </div>
                                    <span className={`text-sm ${field.enabled ? 'text-foreground' : 'text-muted-foreground'}`}>
                                        {field.label}
                                    </span>
                                    {field.id === 'nome' && <span className="text-xs text-muted-foreground">(obrigatório)</span>}
                                </div>
                                <div className="flex items-center gap-3">
                                    {field.enabled && field.id !== 'nome' && (
                                        <div className="flex items-center gap-2">
                                            <Label className="text-xs text-muted-foreground">Obrig.</Label>
                                            <Switch checked={field.required} onCheckedChange={() => onToggleRequired(field.id)} />
                                        </div>
                                    )}
                                    {field.id.startsWith('custom_') && (
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onRemoveCustomField(field.id)}>
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-border/50">
                        <Input
                            placeholder="Adicionar campo personalizado..."
                            value={customFieldLabel}
                            onChange={(e) => setCustomFieldLabel(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), onAddCustomField())}
                        />
                        <Button type="button" variant="outline" onClick={onAddCustomField} disabled={!customFieldLabel.trim()}>
                            <Plus className="w-4 h-4" /> Adicionar
                        </Button>
                    </div>

                    <div className="flex justify-between gap-3 pt-4">
                        <Button type="button" variant="ghost" onClick={() => setFormStep(0)}>Voltar</Button>
                        <div className="flex gap-3">
                            <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
                            <Button type="submit" variant="hero" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : isEditing ? 'Atualizar' : 'Criar Inscrição'}
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </form>
    );
}
