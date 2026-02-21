import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import {
    Plus,
    Loader2,
    ClipboardList,
    Copy,
    ExternalLink,
    MoreHorizontal,
    CheckCircle2,
    XCircle,
    Users,
    Edit,
    Trash2,
    QrCode,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import InscricaoRespostasView from './InscricaoRespostasView';
import InscricaoFormSteps from './InscricaoFormSteps';
import QRCodeDialog from './QRCodeDialog';

import { FieldConfig, InscricaoEvento, RespostaInscricao, Evento, EventoRecorrente } from '@/types/app-types';

type Resposta = RespostaInscricao;

const DEFAULT_FIELDS: FieldConfig[] = [
    { id: 'nome', label: 'Nome completo', type: 'text', required: true, enabled: true, placeholder: 'Digite seu nome completo', icon: 'user' },
    { id: 'telefone', label: 'Telefone (WhatsApp)', type: 'tel', required: false, enabled: true, placeholder: '(00) 00000-0000', icon: 'phone' },
    { id: 'email', label: 'E-mail', type: 'email', required: false, enabled: true, placeholder: 'seu@email.com', icon: 'mail' },
    { id: 'data_nascimento', label: 'Data de nascimento', type: 'date', required: false, enabled: false, icon: 'calendar' },
    { id: 'batizado', label: 'É batizado(a)?', type: 'select', required: false, enabled: false, options: ['Não', 'Sim'], icon: 'church' },
    { id: 'instagram', label: 'Instagram', type: 'text', required: false, enabled: false, placeholder: '@seu_usuario', icon: 'instagram' },
    { id: 'cidade', label: 'Cidade', type: 'text', required: false, enabled: false, placeholder: 'Sua cidade', icon: 'mappin' },
    { id: 'como_conheceu', label: 'Como nos conheceu?', type: 'text', required: false, enabled: false, placeholder: 'Amigos, redes sociais...', icon: 'heart' },
];

export default function InscricoesTab() {
    const [inscricoes, setInscricoes] = useState<InscricaoEvento[]>([]);
    const [eventos, setEventos] = useState<Evento[]>([]);
    const [recorrentes, setRecorrentes] = useState<EventoRecorrente[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editing, setEditing] = useState<InscricaoEvento | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [uploadingCapa, setUploadingCapa] = useState(false);
    const [uploadingTitulo, setUploadingTitulo] = useState(false);

    // View inscritos
    const [viewingInscricao, setViewingInscricao] = useState<InscricaoEvento | null>(null);
    const [respostas, setRespostas] = useState<Resposta[]>([]);
    const [loadingRespostas, setLoadingRespostas] = useState(false);

    // Form
    const [formData, setFormData] = useState({
        titulo: '',
        descricao: '',
        slug: '',
        evento_id: '',
        recorrente_id: '',
        cor_primaria: '#D4A017',
        cor_fundo: '#0F0F0F',
        imagem_capa_url: '',
        imagem_titulo_url: '',
        max_vagas: '',
        data_limite: '',
        ativa: true,
    });
    const [campos, setCampos] = useState<FieldConfig[]>(DEFAULT_FIELDS);
    const [customFieldLabel, setCustomFieldLabel] = useState('');
    const [formStep, setFormStep] = useState(0);
    const [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => {
        fetchAll();
    }, []);

    // Handle deep linking to a specific inscription
    useEffect(() => {
        const viewId = searchParams.get('id');
        if (viewId && inscricoes.length > 0) {
            const linkedInsc = inscricoes.find(i => i.id === viewId);
            if (linkedInsc && !viewingInscricao) {
                setViewingInscricao(linkedInsc);
                fetchRespostas(linkedInsc.id);
            }
        }
    }, [searchParams, inscricoes, viewingInscricao]);

    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [isQRCodeOpen, setIsQRCodeOpen] = useState(false);

    async function fetchAll() {
        setLoading(true);
        await Promise.all([fetchInscricoes(), fetchEventos(), fetchRecorrentes()]);
        setLoading(false);
    }

    async function fetchInscricoes() {
        try {
            const { data, error } = await supabase.from('inscricoes_evento').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            setInscricoes((data || []).map((d: any) => ({
                ...d,
                campos_personalizados: (d.campos_personalizados || DEFAULT_FIELDS) as unknown as FieldConfig[],
            } as unknown as InscricaoEvento)));
        } catch (error) { console.error('Error fetching inscricoes:', error); }
    }

    async function fetchEventos() {
        try {
            const { data, error } = await supabase.from('eventos').select('id, titulo, data_evento').order('data_evento', { ascending: false }).limit(50);
            if (error) throw error;
            setEventos((data as any) || []);
        } catch (error) { console.error('Error fetching eventos:', error); }
    }

    async function fetchRecorrentes() {
        try {
            const { data, error } = await supabase.from('eventos_recorrentes').select('id, titulo').eq('ativo', true).order('titulo');
            if (error) throw error;
            setRecorrentes((data as any) || []);
        } catch (error) { console.error('Error fetching recorrentes:', error); }
    }

    async function fetchRespostas(inscricaoId: string) {
        setLoadingRespostas(true);
        try {
            const { data, error } = await supabase.from('inscricoes_evento_respostas').select('*').eq('inscricao_id', inscricaoId).order('created_at', { ascending: false });
            if (error) throw error;
            setRespostas((data || []).map((d: any) => ({ ...d, dados: d.dados as Record<string, string> } as unknown as Resposta)));
        } catch (error) { console.error('Error fetching respostas:', error); }
        finally { setLoadingRespostas(false); }
    }

    async function handleDeleteResposta(id: string) {
        try {
            const { error } = await supabase.from('inscricoes_evento_respostas').delete().eq('id', id);
            if (error) throw error;
            toast.success('Inscrição excluída com sucesso');
            if (viewingInscricao) fetchRespostas(viewingInscricao.id);
        } catch (error) {
            console.error('Error deleting resposta:', error);
            toast.error('Erro ao excluir inscrição');
        }
    }

    function generateSlug(titulo: string): string {
        return titulo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }

    function resetForm() {
        setFormData({
            titulo: '', descricao: '', slug: '', evento_id: '', recorrente_id: '',
            cor_primaria: '#D4A017', cor_fundo: '#0F0F0F', imagem_capa_url: '',
            imagem_titulo_url: '', max_vagas: '', data_limite: '', ativa: true,
        });
        setCampos(DEFAULT_FIELDS);
        setEditing(null);
        setFormStep(0);
        setCustomFieldLabel('');
    }

    // Upload Handlers
    async function handleCapaUpload(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { toast.error('Selecione uma imagem válida'); return; }
        if (file.size > 5 * 1024 * 1024) { toast.error('A imagem deve ter no máximo 5MB'); return; }
        setUploadingCapa(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `eventos - capa / ${Date.now()} -${Math.random().toString(36).substring(7)}.${fileExt} `;
            const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file);
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
            setFormData(prev => ({ ...prev, imagem_capa_url: publicUrl }));
            toast.success('Imagem enviada!');
        } catch (error) { console.error('Error uploading capa:', error); toast.error('Erro ao enviar imagem'); }
        finally { setUploadingCapa(false); }
    }

    function handleCapaRemove() { setFormData(prev => ({ ...prev, imagem_capa_url: '' })); }

    async function handleTituloUpload(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { toast.error('Selecione uma imagem válida'); return; }
        if (file.size > 5 * 1024 * 1024) { toast.error('A imagem deve ter no máximo 5MB'); return; }
        setUploadingTitulo(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `eventos - titulo / ${Date.now()} -${Math.random().toString(36).substring(7)}.${fileExt} `;
            const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file);
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
            setFormData(prev => ({ ...prev, imagem_titulo_url: publicUrl }));
            toast.success('Imagem do título enviada!');
        } catch (error) { console.error('Error uploading titulo:', error); toast.error('Erro ao enviar imagem'); }
        finally { setUploadingTitulo(false); }
    }

    function handleTituloRemove() { setFormData(prev => ({ ...prev, imagem_titulo_url: '' })); }

    function openEdit(insc: any) {
        setEditing(insc);
        setFormData({
            titulo: insc.titulo, descricao: insc.descricao || '', slug: insc.slug,
            evento_id: insc.evento_id || '', recorrente_id: insc.recorrente_id || '',
            cor_primaria: insc.cor_primaria, cor_fundo: insc.cor_fundo,
            imagem_capa_url: insc.imagem_capa_url || '',
            imagem_titulo_url: insc.imagem_titulo_url || '',
            max_vagas: insc.max_vagas?.toString() || '',
            data_limite: insc.data_limite || '', ativa: insc.ativa,
        });
        setCampos(insc.campos_personalizados?.length > 0 ? insc.campos_personalizados : DEFAULT_FIELDS);
        setFormStep(0);
        setIsDialogOpen(true);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload: any = {
                titulo: formData.titulo,
                descricao: formData.descricao || null,
                slug: formData.slug,
                evento_id: formData.evento_id || null,
                recorrente_id: formData.recorrente_id || null,
                cor_primaria: formData.cor_primaria,
                cor_fundo: formData.cor_fundo,
                imagem_capa_url: formData.imagem_capa_url || null,
                imagem_titulo_url: formData.imagem_titulo_url || null,
                campos_personalizados: campos,
                max_vagas: formData.max_vagas ? parseInt(formData.max_vagas) : null,
                data_limite: formData.data_limite || null,
                ativa: formData.ativa,
            };

            if (editing) {
                const { error } = await supabase.from('inscricoes_evento').update(payload).eq('id', editing.id);
                if (error) throw error;
                toast.success('Inscrição atualizada!');
            } else {
                const { error } = await supabase.from('inscricoes_evento').insert([payload]);
                if (error) throw error;
                toast.success('Inscrição criada!');
            }
            setIsDialogOpen(false);
            resetForm();
            fetchAll();
        } catch (error: any) {
            if (error?.code === '23505') toast.error('Já existe uma inscrição com este slug');
            else { console.error('Error:', error); toast.error('Erro ao salvar inscrição'); }
        } finally { setIsSubmitting(false); }
    }

    async function handleDelete() {
        if (!deleteId) return;
        try {
            const { error } = await supabase.from('inscricoes_evento').delete().eq('id', deleteId);
            if (error) throw error;
            toast.success('Inscrição excluída'); fetchInscricoes();
        } catch (error) { toast.error('Erro ao excluir inscrição'); }
        finally { setDeleteId(null); }
    }

    function copyLink(slug: string) {
        const url = `${window.location.origin} /evento/${slug} `;
        navigator.clipboard.writeText(url);
        toast.success('Link copiado!');
    }

    function openQRCode(slug: string) {
        setQrCodeUrl(`${window.location.origin} /evento/${slug} `);
        setIsQRCodeOpen(true);
    }

    // Field handlers
    function toggleField(fieldId: string) { setCampos(prev => prev.map(f => f.id === fieldId ? { ...f, enabled: !f.enabled } : f)); }
    function toggleRequired(fieldId: string) { setCampos(prev => prev.map(f => f.id === fieldId ? { ...f, required: !f.required } : f)); }
    function addCustomField() {
        if (!customFieldLabel.trim()) return;
        setCampos(prev => [...prev, {
            id: `custom_${Date.now()} `, label: customFieldLabel, type: 'text', required: false, enabled: true, placeholder: `Digite ${customFieldLabel.toLowerCase()} `, icon: 'heart',
        }]);
        setCustomFieldLabel('');
    }
    function removeCustomField(id: string) { setCampos(prev => prev.filter(f => f.id !== id)); }

    function handleBack() {
        setViewingInscricao(null);
        setRespostas([]);
        // Clear search params when going back
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('id');
        setSearchParams(newParams);
    }

    if (viewingInscricao) {
        return (
            <InscricaoRespostasView
                inscricao={viewingInscricao}
                respostas={respostas}
                loading={loadingRespostas}
                onBack={handleBack}
                onCopyLink={copyLink}
                onShowQRCode={openQRCode}
                onDeleteResposta={handleDeleteResposta}
            />
        );
    }

    return (
        <div className="space-y-6">
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Inscrição</AlertDialogTitle>
                        <AlertDialogDescription>Todos os dados de inscritos serão perdidos. Esta ação não pode ser desfeita.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="font-display flex items-center gap-2">
                            <ClipboardList className="w-5 h-5 text-primary" />
                            {editing ? 'Editar Inscrição' : 'Nova Inscrição'}
                        </DialogTitle>
                        <DialogDescription>{formStep === 0 ? 'Dados básicos da inscrição' : 'Configure os campos do formulário'}</DialogDescription>
                    </DialogHeader>

                    {/* Step indicator */}
                    <div className="flex gap-2 mb-2">
                        {[0, 1].map(step => (
                            <button key={step} onClick={() => setFormStep(step)} className={`flex - 1 h - 1.5 rounded - full transition - all ${formStep === step ? 'bg-primary' : 'bg-muted'} `} />
                        ))}
                    </div>

                    <InscricaoFormSteps
                        formStep={formStep}
                        setFormStep={setFormStep}
                        formData={formData as any}
                        setFormData={setFormData as any}
                        campos={campos as any}
                        eventos={eventos}
                        recorrentes={recorrentes}
                        isEditing={!!editing}
                        isSubmitting={isSubmitting}
                        uploadingCapa={uploadingCapa}
                        uploadingTitulo={uploadingTitulo}
                        customFieldLabel={customFieldLabel}
                        setCustomFieldLabel={setCustomFieldLabel}
                        onSubmit={handleSubmit}
                        onCancel={() => { setIsDialogOpen(false); resetForm(); }}
                        onCapaUpload={handleCapaUpload}
                        onCapaRemove={handleCapaRemove}
                        onTituloUpload={handleTituloUpload}
                        onTituloRemove={handleTituloRemove}
                        onToggleField={toggleField}
                        onToggleRequired={toggleRequired}
                        onAddCustomField={addCustomField}
                        onRemoveCustomField={removeCustomField}
                        generateSlug={generateSlug}
                    />
                </DialogContent>
            </Dialog>

            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : inscricoes.length === 0 ? (
                <Card className="glass-card">
                    <CardContent className="flex flex-col items-center py-12 text-center">
                        <ClipboardList className="w-12 h-12 text-muted-foreground/50 mb-4" />
                        <h3 className="font-semibold text-foreground">Nenhuma inscrição criada</h3>
                        <p className="text-sm text-muted-foreground mt-1">Crie uma página de inscrição para um evento</p>
                        <Button variant="hero" className="mt-4" onClick={() => setIsDialogOpen(true)}><Plus className="w-4 h-4" /> Nova Inscrição</Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <Button variant="hero" onClick={() => setIsDialogOpen(true)}><Plus className="w-4 h-4" /> Nova Inscrição</Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {inscricoes.map((insc, idx) => {
                            const eventoRef = eventos.find(e => e.id === insc.evento_id);
                            return (
                                <Card key={insc.id} className="glass-card overflow-hidden animate-slide-up opacity-0 hover:shadow-lg transition-shadow" style={{ animationDelay: `${idx * 80} ms`, animationFillMode: 'forwards' }}>
                                    <div className="h-2" style={{ backgroundColor: insc.cor_primaria }} />
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <CardTitle className="text-base font-display">{insc.titulo}</CardTitle>
                                                {eventoRef && <p className="text-xs text-muted-foreground mt-1">{eventoRef.titulo} • {format(parseISO(eventoRef.data_evento), 'dd/MM/yyyy')}</p>}
                                                <div className="flex gap-2 mt-2 flex-wrap">
                                                    <Badge variant={insc.ativa ? 'default' : 'secondary'} className={insc.ativa ? 'bg-success/10 text-success' : ''}>
                                                        {insc.ativa ? <><CheckCircle2 className="w-3 h-3 mr-1" /> Ativa</> : <><XCircle className="w-3 h-3 mr-1" /> Inativa</>}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => { setViewingInscricao(insc); fetchRespostas(insc.id); }}><Users className="w-4 h-4 mr-2" /> Ver Inscritos</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => copyLink(insc.slug)}><Copy className="w-4 h-4 mr-2" /> Copiar Link</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => openQRCode(insc.slug)}><QrCode className="w-4 h-4 mr-2" /> Gerar QR Code</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => window.open(`/ evento / ${insc.slug} `, '_blank')}><ExternalLink className="w-4 h-4 mr-2" /> Abrir Página</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => openEdit(insc)}><Edit className="w-4 h-4 mr-2" /> Editar</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                                            <div className="flex items-center gap-2"><ClipboardList className="w-4 h-4" /> <span>Formulário</span></div>
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="outline" onClick={() => openEdit(insc)}>Editar</Button>
                                                <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => setDeleteId(insc.id)}><Trash2 className="w-4 h-4" /></Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}

            <QRCodeDialog
                url={qrCodeUrl}
                open={isQRCodeOpen}
                onOpenChange={setIsQRCodeOpen}
                title={viewingInscricao?.titulo || ''}
            />
        </div>
    );
}
