import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Plus, Megaphone, Calendar, Users, Loader2, MoreHorizontal, Edit, Trash2,
  UserPlus, Eye, QrCode, Copy, ExternalLink, Settings2, CheckCircle, XCircle
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { QRCodeSVG } from 'qrcode.react';
import { Switch } from '@/components/ui/switch';
import { CampaignFieldsConfig, DEFAULT_FIELDS, FieldConfig } from '@/features/campanhas/components/CampaignFieldsConfig';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Campanha, InscricaoCampanha } from '@/types/app-types';

// Local UI interface extensions if needed
interface ExtendedCampanha extends Omit<Campanha, 'inscricoes_campanha'> {
  inscricoes_campanha?: any[];
}

function generateSlug(title: string): string {
  return title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
}

export default function Campanhas() {
  const [campanhas, setCampanhas] = useState<ExtendedCampanha[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCampanha, setEditingCampanha] = useState<ExtendedCampanha | null>(null);
  const [selectedCampanha, setSelectedCampanha] = useState<ExtendedCampanha | null>(null);
  const [isQRSheetOpen, setIsQRSheetOpen] = useState(false);
  const [isInscricoesSheetOpen, setIsInscricoesSheetOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [selectedInscricao, setSelectedInscricao] = useState<any | null>(null);
  const [validationFormData, setValidationFormData] = useState<any>({});
  const [deleteInscricaoId, setDeleteInscricaoId] = useState<string | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedInscricaoDetails, setSelectedInscricaoDetails] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    nome: '', descricao: '', data_inicio: '', data_fim: '', slug: '',
    cor_primaria: '#D4A84B', cor_fundo: '#0a0a12', imagem_capa_url: '',
    tipo_cadastro: 'visitante' as 'jovem' | 'visitante' | 'lider',
    objetivo_cadastro: 'criacao' as 'criacao' | 'atualizacao',
    solicitar_foto: false,
  });

  const [formFields, setFormFields] = useState<FieldConfig[]>(DEFAULT_FIELDS);

  useEffect(() => { fetchCampanhas(); }, []);

  async function fetchCampanhas() {
    try {
      const { data, error } = await supabase
        .from('campanhas')
        .select('*, inscricoes_campanha(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setCampanhas((data as any[]) || []);
    } catch { toast.error('Erro ao carregar campanhas'); } finally { setLoading(false); }
  }

  function resetForm() {
    setFormData({ nome: '', descricao: '', data_inicio: '', data_fim: '', slug: '', cor_primaria: '#D4A84B', cor_fundo: '#0a0a12', imagem_capa_url: '', tipo_cadastro: 'visitante', objetivo_cadastro: 'criacao', solicitar_foto: false });
    setFormFields(DEFAULT_FIELDS);
    setEditingCampanha(null);
  }

  function openEditDialog(campanha: Campanha) {
    setEditingCampanha(campanha);
    setFormData({
      nome: campanha.nome, descricao: campanha.descricao || '', data_inicio: campanha.data_inicio, data_fim: campanha.data_fim || '',
      slug: campanha.slug || '', cor_primaria: campanha.cor_primaria || '#D4A84B', cor_fundo: campanha.cor_fundo || '#0a0a12', imagem_capa_url: campanha.imagem_capa_url || '',
      tipo_cadastro: campanha.tipo_cadastro || 'visitante',
      objetivo_cadastro: (campanha as any).objetivo_cadastro || 'criacao',
      solicitar_foto: (campanha as any).solicitar_foto || false
    });
    const existing = Array.isArray(campanha.campos_personalizados) ? campanha.campos_personalizados as unknown as FieldConfig[] : DEFAULT_FIELDS;
    setFormFields(existing.length > 0 ? existing : DEFAULT_FIELDS);
    setIsDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const slug = formData.slug || generateSlug(formData.nome);
      const payload = {
        nome: formData.nome, descricao: formData.descricao || null, data_inicio: formData.data_inicio, data_fim: formData.data_fim || null,
        slug, cor_primaria: formData.cor_primaria, cor_fundo: formData.cor_fundo, imagem_capa_url: formData.imagem_capa_url || null,
        campos_personalizados: JSON.parse(JSON.stringify(formFields)),
        tipo_cadastro: formData.tipo_cadastro,
        objetivo_cadastro: formData.objetivo_cadastro,
        solicitar_foto: formData.solicitar_foto
      };

      if (editingCampanha) {
        await supabase.from('campanhas').update(payload as any).eq('id', editingCampanha.id);
        toast.success('Campanha atualizada!');
      } else {
        await supabase.from('campanhas').insert(payload as any);
        toast.success('Campanha criada!');
      }
      setIsDialogOpen(false); fetchCampanhas(); resetForm();
    } catch (e: any) { toast.error(e.code === '23505' ? 'Slug já existe' : 'Erro ao salvar'); } finally { setIsSubmitting(false); }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await supabase.from('campanhas').delete().eq('id', deleteId);
      toast.success('Campanha excluída'); fetchCampanhas();
    } catch { toast.error('Erro ao excluir'); } finally { setDeleteId(null); }
  }

  async function toggleAtiva(id: string, ativa: boolean) {
    try {
      await supabase.from('campanhas').update({ ativa: !ativa }).eq('id', id);
      toast.success(ativa ? 'Desativada' : 'Ativada'); fetchCampanhas();
    } catch { toast.error('Erro ao atualizar'); }
  }

  async function handleDeleteInscricao() {
    if (!deleteInscricaoId) return;
    try {
      const { error } = await supabase.from('inscricoes_campanha').delete().eq('id', deleteInscricaoId);
      if (error) throw error;
      toast.success('Cadastro excluído com sucesso!');
      fetchCampanhas();
    } catch (err: any) {
      toast.error('Erro ao excluir cadastro: ' + err.message);
    } finally {
      setDeleteInscricaoId(null);
    }
  }

  function openQRSheet(c: Campanha) { setSelectedCampanha(c); setIsQRSheetOpen(true); }
  function openInscricoes(c: Campanha) { setSelectedCampanha(c); setIsInscricoesSheetOpen(true); }

  function openValidationModal(inscricao: any) {
    setSelectedInscricao(inscricao);
    setValidationFormData({
      nome: inscricao.nome_visitante,
      telefone: inscricao.telefone || '',
      idade: inscricao.idade || '',
      tipo: selectedCampanha?.tipo_cadastro || 'visitante'
    });
    setIsValidating(true);
  }

  async function handleConfirmValidation(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedInscricao || !selectedCampanha) return;

    setIsSubmitting(true);
    try {
      const tipo = selectedCampanha.tipo_cadastro || 'visitante';
      const table = tipo === 'jovem' ? 'jovens' : tipo === 'lider' ? 'lideres' : 'jovens_visitantes';

      const payload: any = {
        nome: validationFormData.nome,
        telefone: validationFormData.telefone,
      };

      if (tipo === 'visitante') payload.idade = validationFormData.idade;
      if (tipo === 'jovem') payload.data_nascimento = validationFormData.data_nascimento;
      if (selectedInscricao.foto_url) payload.foto_url = selectedInscricao.foto_url;

      // 1. Criar registro oficial
      const { error: insertError } = await supabase.from(table).insert(payload as any);
      if (insertError) throw insertError;

      // 2. Marcar cadastro como confirmado
      const { error: updateError } = await supabase
        .from('inscricoes_campanha')
        .update({ status_validacao: 'confirmado', validado_em: new Date().toISOString() } as any)
        .eq('id', selectedInscricao.id);

      if (updateError) throw updateError;

      toast.success('Cadastro confirmado com sucesso!');
      setIsValidating(false);
      fetchCampanhas();
    } catch (err: any) {
      toast.error('Erro ao validar: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const getUrl = (slug: string) => `${window.location.origin}/campanha/${slug}`;
  const copyLink = (slug: string) => { navigator.clipboard.writeText(getUrl(slug)); toast.success('Link copiado!'); };

  // Stats
  const activeCampanhas = campanhas.filter(c => c.ativa);
  const inactiveCampanhas = campanhas.filter(c => !c.ativa);
  const totalInscritos = campanhas.reduce((acc, c) => acc + (c.inscricoes_campanha?.length || 0), 0);

  const renderCard = (c: Campanha, i: number, active: boolean) => (
    <Card key={c.id} className={`glass-card animate-slide-up opacity-0 hover:shadow-lg transition-all border-l-4 ${active ? 'border-l-success' : 'border-l-muted opacity-80'}`} style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'forwards' }}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex gap-3">
            <div className={`p-2.5 rounded-xl ${active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-display">{c.nome}</CardTitle>
              <div className="flex gap-2 mt-1">
                <Badge variant={active ? 'default' : 'secondary'} className={active ? 'bg-success/10 text-success' : ''}>{active ? 'Ativa' : 'Encerrada'}</Badge>
                {c.slug && <Badge variant="outline" className="text-[10px] font-mono">/{c.slug}</Badge>}
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {active && c.slug && (
                <>
                  <DropdownMenuItem onClick={() => openQRSheet(c)}><QrCode className="w-4 h-4 mr-2" />QR Code</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => copyLink(c.slug!)}><Copy className="w-4 h-4 mr-2" />Copiar Link</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.open(getUrl(c.slug!), '_blank')}><ExternalLink className="w-4 h-4 mr-2" />Ver Página</DropdownMenuItem>
                </>
              )}
              <DropdownMenuItem onClick={() => openInscricoes(c)}><Eye className="w-4 h-4 mr-2" />Cadastros</DropdownMenuItem>
              <DropdownMenuItem onClick={() => openEditDialog(c)}><Edit className="w-4 h-4 mr-2" />Editar</DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleAtiva(c.id, c.ativa)}>{active ? 'Pausar' : 'Reativar'}</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(c.id)}><Trash2 className="w-4 h-4 mr-2" />Excluir</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        {c.descricao && <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{c.descricao}</p>}
        {c.cor_primaria && (
          <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
            <div className="w-3 h-3 rounded-full" style={{ background: c.cor_primaria || '#D4A84B' }} />
            Cor do tema
          </div>
        )}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>{format(parseISO(c.data_inicio), 'dd MMM', { locale: ptBR })}{c.data_fim && ` - ${format(parseISO(c.data_fim), 'dd MMM', { locale: ptBR })}`}</span>
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <UserPlus className="w-4 h-4" />
            {c.inscricoes_campanha?.length || 0}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Campanhas</h1>
          <p className="text-muted-foreground mt-1">Gerencie campanhas e cadastros</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(o) => { setIsDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild><Button variant="hero"><Plus className="w-4 h-4" />Nova Campanha</Button></DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">{editingCampanha ? 'Editar' : 'Nova'} Campanha</DialogTitle>
              <DialogDescription>Configure os detalhes e campos</DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="geral" className="mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="geral">Geral</TabsTrigger>
                <TabsTrigger value="campos">Formulário</TabsTrigger>
              </TabsList>
              <form onSubmit={handleSubmit}>
                <TabsContent value="geral" className="space-y-4 mt-4">
                  <div className="space-y-2"><Label>Nome *</Label><Input value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value, slug: editingCampanha ? formData.slug : generateSlug(e.target.value) })} required /></div>
                  <div className="space-y-2"><Label>Slug</Label><Input value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })} /><p className="text-xs text-muted-foreground">URL: .../campanha/{formData.slug || 'slug'}</p></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Início *</Label><Input type="date" value={formData.data_inicio} onChange={e => setFormData({ ...formData, data_inicio: e.target.value })} required /></div>
                    <div className="space-y-2"><Label>Fim</Label><Input type="date" value={formData.data_fim} onChange={e => setFormData({ ...formData, data_fim: e.target.value })} /></div>
                  </div>
                  <div className="space-y-2"><Label>Descrição</Label><Textarea value={formData.descricao} onChange={e => setFormData({ ...formData, descricao: e.target.value })} rows={3} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo de Cadastro</Label>
                      <Select value={formData.tipo_cadastro} onValueChange={(v: any) => setFormData({ ...formData, tipo_cadastro: v })}>
                        <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="jovem">Jovens</SelectItem>
                          <SelectItem value="visitante">Visitantes</SelectItem>
                          <SelectItem value="lider">Líderes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Objetivo</Label>
                      <Select value={formData.objetivo_cadastro} onValueChange={(v: any) => setFormData({ ...formData, objetivo_cadastro: v })}>
                        <SelectTrigger><SelectValue placeholder="Selecione o objetivo" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="criacao">Criação de Cadastro</SelectItem>
                          <SelectItem value="atualizacao">Atualização de Cadastro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-muted/5">
                    <div className="space-y-0.5">
                      <Label className="text-base">Solicitar Foto</Label>
                      <p className="text-xs text-muted-foreground">Exige que o inscrito envie uma foto</p>
                    </div>
                    <Switch
                      checked={formData.solicitar_foto}
                      onCheckedChange={(v) => setFormData({ ...formData, solicitar_foto: v })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Capa URL</Label><Input value={formData.imagem_capa_url} onChange={e => setFormData({ ...formData, imagem_capa_url: e.target.value })} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Cor Tema</Label><div className="flex gap-2"><Input type="color" value={formData.cor_primaria} onChange={e => setFormData({ ...formData, cor_primaria: e.target.value })} className="w-12 h-10 p-1" /><Input value={formData.cor_primaria} onChange={e => setFormData({ ...formData, cor_primaria: e.target.value })} /></div></div>
                    <div className="space-y-2"><Label>Cor Fundo</Label><div className="flex gap-2"><Input type="color" value={formData.cor_fundo} onChange={e => setFormData({ ...formData, cor_fundo: e.target.value })} className="w-12 h-10 p-1" /><Input value={formData.cor_fundo} onChange={e => setFormData({ ...formData, cor_fundo: e.target.value })} /></div></div>
                  </div>
                </TabsContent>
                <TabsContent value="campos" className="mt-4"><CampaignFieldsConfig fields={formFields} onChange={setFormFields} /></TabsContent>
                <div className="flex justify-end gap-3 pt-6 border-t mt-6">
                  <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>Cancelar</Button>
                  <Button type="submit" variant="hero" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}</Button>
                </div>
              </form>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card"><CardContent className="pt-4 pb-3"><div className="flex justify-between"><p className="text-sm text-muted-foreground">Total</p><Megaphone className="w-4 h-4 text-muted-foreground" /></div><p className="text-2xl font-bold mt-1">{campanhas.length}</p></CardContent></Card>
        <Card className="glass-card"><CardContent className="pt-4 pb-3"><div className="flex justify-between"><p className="text-sm text-muted-foreground">Ativas</p><CheckCircle className="w-4 h-4 text-success" /></div><p className="text-2xl font-bold mt-1 text-success">{activeCampanhas.length}</p></CardContent></Card>
        <Card className="glass-card"><CardContent className="pt-4 pb-3"><div className="flex justify-between"><p className="text-sm text-muted-foreground">Encerradas</p><XCircle className="w-4 h-4 text-muted-foreground" /></div><p className="text-2xl font-bold mt-1 text-muted-foreground">{inactiveCampanhas.length}</p></CardContent></Card>
        <Card className="glass-card"><CardContent className="pt-4 pb-3"><div className="flex justify-between"><p className="text-sm text-muted-foreground">Cadastros</p><UserPlus className="w-4 h-4 text-primary" /></div><p className="text-2xl font-bold mt-1 text-primary">{totalInscritos}</p></CardContent></Card>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle><AlertDialogDescription>Ação irreversível.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteInscricaoId} onOpenChange={(o) => !o && setDeleteInscricaoId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Cadastro</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja remover este cadastro? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteInscricao} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {loading ? <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div> :
        campanhas.length === 0 ? <Card className="glass-card py-12 text-center"><Megaphone className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" /><h3 className="font-semibold">Nenhuma campanha criada</h3></Card> :
          <div className="space-y-8">
            {activeCampanhas.length > 0 && <div><h2 className="text-xl font-display font-semibold mb-4 flex gap-2 items-center"><span className="flex h-2 w-2 rounded-full bg-success animate-pulse" />Ativas</h2><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{activeCampanhas.map((c, i) => renderCard(c, i, true))}</div></div>}
            {inactiveCampanhas.length > 0 && <div><h2 className="text-xl font-display font-semibold mb-4 text-muted-foreground">Encerradas</h2><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{inactiveCampanhas.map((c, i) => renderCard(c, i, false))}</div></div>}
          </div>
      }

      <Sheet open={isQRSheetOpen} onOpenChange={setIsQRSheetOpen}>
        <SheetContent className="sm:max-w-md">
          {selectedCampanha && selectedCampanha.slug && <>
            <SheetHeader><SheetTitle>QR Code</SheetTitle><SheetDescription>{selectedCampanha.nome}</SheetDescription></SheetHeader>
            <div className="mt-6 flex flex-col items-center gap-6">
              <div className="p-4 bg-white rounded-xl"><QRCodeSVG value={getUrl(selectedCampanha.slug)} size={200} /></div>
              <p className="font-mono text-xs bg-muted p-2 rounded">{getUrl(selectedCampanha.slug)}</p>
              <div className="flex gap-2"><Button variant="outline" onClick={() => copyLink(selectedCampanha.slug!)}><Copy className="w-4 h-4 mr-2" />Copiar</Button><Button variant="hero" onClick={() => window.open(getUrl(selectedCampanha.slug!), '_blank')}><ExternalLink className="w-4 h-4 mr-2" />Abrir</Button></div>
            </div>
          </>}
        </SheetContent>
      </Sheet>

      <Sheet open={isInscricoesSheetOpen} onOpenChange={setIsInscricoesSheetOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selectedCampanha && <>
            <SheetHeader><SheetTitle>Cadastros</SheetTitle><SheetDescription>{selectedCampanha.inscricoes_campanha?.length || 0} total</SheetDescription></SheetHeader>
            <div className="mt-6 space-y-3">
              {(selectedCampanha.inscricoes_campanha || []).length === 0 ? <p className="text-center text-muted-foreground py-8">Sem cadastros</p> :
                selectedCampanha.inscricoes_campanha?.map(i => (
                  <div key={i.id} className="flex gap-3 p-3 rounded-lg border bg-muted/30 items-center">
                    <div className="p-2 rounded-full bg-primary/10"><UserPlus className="w-4 h-4 text-primary" /></div>
                    <div className="flex-1"><p className="font-medium text-sm">{i.nome_visitante}</p><p className="text-xs text-muted-foreground">{i.telefone || '-'}</p></div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs text-muted-foreground">{format(parseISO(i.created_at), 'dd/MM/yy', { locale: ptBR })}</span>
                      <Badge variant={i.status_validacao === 'confirmado' ? 'secondary' : 'outline'} className={`text-[10px] py-0 ${i.status_validacao === 'confirmado' ? 'bg-success/20 text-success border-success/20' : ''}`}>
                        {i.status_validacao?.toUpperCase() || 'PENDENTE'}
                      </Badge>
                      <div className="flex gap-2">
                        {i.status_validacao !== 'confirmado' && (
                          <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => openValidationModal(i)}>Validar</Button>
                        )}
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-xs text-primary hover:text-primary/80"
                          onClick={() => {
                            setSelectedInscricaoDetails(i);
                            setIsDetailsDialogOpen(true);
                          }}
                        >
                          Ver Dados
                        </Button>
                        <Button variant="link" size="sm" className="h-auto p-0 text-xs text-destructive hover:text-destructive/80" onClick={() => setDeleteInscricaoId(i.id)}>Excluir</Button>
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          </>}
        </SheetContent>
      </Sheet>

      <Dialog open={isValidating} onOpenChange={setIsValidating}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Cadastro</DialogTitle>
            <DialogDescription>Valide os dados para oficializar o registro como {validationFormData.tipo}.</DialogDescription>
          </DialogHeader>
          {selectedInscricao?.foto_url && (
            <div className="flex flex-col items-center gap-2 mt-4">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-muted shadow-lg">
                <img
                  src={selectedInscricao.foto_url}
                  alt="Foto do inscrito"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Foto enviada</p>
            </div>
          )}
          <form onSubmit={handleConfirmValidation} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input value={validationFormData.nome} onChange={e => setValidationFormData({ ...validationFormData, nome: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Telefone (WhatsApp)</Label>
              <Input value={validationFormData.telefone} onChange={e => setValidationFormData({ ...validationFormData, telefone: e.target.value })} required />
            </div>

            {validationFormData.tipo === 'visitante' && (
              <div className="space-y-2">
                <Label>Idade</Label>
                <Input type="number" value={validationFormData.idade} onChange={e => setValidationFormData({ ...validationFormData, idade: e.target.value })} />
              </div>
            )}

            {validationFormData.tipo === 'jovem' && (
              <div className="space-y-2">
                <Label>Data de Nascimento</Label>
                <Input type="date" value={validationFormData.data_nascimento} onChange={e => setValidationFormData({ ...validationFormData, data_nascimento: e.target.value })} />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsValidating(false)}>Cancelar</Button>
              <Button type="submit" variant="hero" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                Confirmar e Criar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do Cadastro</DialogTitle>
            <DialogDescription>Dados completos preenchidos pelo usuário.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] mt-4 pr-4">
            <div className="space-y-4">
              {selectedInscricaoDetails?.dados ? (
                Object.entries(selectedInscricaoDetails.dados).map(([key, value]: [string, any]) => {
                  // Pular campos vazios ou técnicos se necessário
                  if (!value || key === 'id' || key === 'updated_at') return null;

                  return (
                    <div key={key} className="border-b border-border/50 pb-2">
                      <Label className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">{key.replace(/_/g, ' ')}</Label>
                      <p className="text-sm font-medium mt-0.5">{String(value)}</p>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground italic">
                  Nenhum dado extra disponível para este cadastro.
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="flex justify-end pt-4 border-t">
            <Button variant="hero" onClick={() => setIsDetailsDialogOpen(false)}>Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
