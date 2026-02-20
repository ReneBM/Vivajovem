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
import { QRCodeSVG } from 'qrcode.react';
import { CampaignFieldsConfig, DEFAULT_FIELDS, FieldConfig } from '@/features/campanhas/components/CampaignFieldsConfig';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Campanha {
  id: string;
  nome: string;
  descricao: string | null;
  data_inicio: string;
  data_fim: string | null;
  ativa: boolean;
  created_at: string;
  slug: string | null;
  cor_primaria: string | null;
  cor_fundo: string | null;
  imagem_capa_url: string | null;
  campos_personalizados: unknown;
  inscricoes_campanha?: { id: string; nome_visitante: string; telefone: string | null; idade: number | null; created_at: string }[];
}

function generateSlug(title: string): string {
  return title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
}

export default function Campanhas() {
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCampanha, setEditingCampanha] = useState<Campanha | null>(null);
  const [selectedCampanha, setSelectedCampanha] = useState<Campanha | null>(null);
  const [isQRSheetOpen, setIsQRSheetOpen] = useState(false);
  const [isInscricoesSheetOpen, setIsInscricoesSheetOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nome: '', descricao: '', data_inicio: '', data_fim: '', slug: '',
    cor_primaria: '#D4A84B', cor_fundo: '#0a0a12', imagem_capa_url: '',
  });

  const [formFields, setFormFields] = useState<FieldConfig[]>(DEFAULT_FIELDS);

  useEffect(() => { fetchCampanhas(); }, []);

  async function fetchCampanhas() {
    try {
      const { data, error } = await supabase.from('campanhas').select('*, inscricoes_campanha(id, nome_visitante, telefone, idade, created_at)').order('created_at', { ascending: false });
      if (error) throw error;
      setCampanhas((data as Campanha[]) || []);
    } catch { toast.error('Erro ao carregar campanhas'); } finally { setLoading(false); }
  }

  function resetForm() {
    setFormData({ nome: '', descricao: '', data_inicio: '', data_fim: '', slug: '', cor_primaria: '#D4A84B', cor_fundo: '#0a0a12', imagem_capa_url: '' });
    setFormFields(DEFAULT_FIELDS);
    setEditingCampanha(null);
  }

  function openEditDialog(campanha: Campanha) {
    setEditingCampanha(campanha);
    setFormData({
      nome: campanha.nome, descricao: campanha.descricao || '', data_inicio: campanha.data_inicio, data_fim: campanha.data_fim || '',
      slug: campanha.slug || '', cor_primaria: campanha.cor_primaria || '#D4A84B', cor_fundo: campanha.cor_fundo || '#0a0a12', imagem_capa_url: campanha.imagem_capa_url || '',
    });
    const existing = Array.isArray(campanha.campos_personalizados) ? campanha.campos_personalizados as FieldConfig[] : DEFAULT_FIELDS;
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

  function openQRSheet(c: Campanha) { setSelectedCampanha(c); setIsQRSheetOpen(true); }
  function openInscricoes(c: Campanha) { setSelectedCampanha(c); setIsInscricoesSheetOpen(true); }
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
              <DropdownMenuItem onClick={() => openInscricoes(c)}><Eye className="w-4 h-4 mr-2" />Inscrições</DropdownMenuItem>
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
          <p className="text-muted-foreground mt-1">Gerencie campanhas e inscrições</p>
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
                  <div className="space-y-2"><Label>Capa URL</Label><Input value={formData.imagem_capa_url} onChange={e => setFormData({ ...formData, imagem_capa_url: e.target.value })} /></div>
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
        <Card className="glass-card"><CardContent className="pt-4 pb-3"><div className="flex justify-between"><p className="text-sm text-muted-foreground">Inscritos</p><UserPlus className="w-4 h-4 text-primary" /></div><p className="text-2xl font-bold mt-1 text-primary">{totalInscritos}</p></CardContent></Card>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle><AlertDialogDescription>Ação irreversível.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
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
            <SheetHeader><SheetTitle>Inscrições</SheetTitle><SheetDescription>{selectedCampanha.inscricoes_campanha?.length || 0} total</SheetDescription></SheetHeader>
            <div className="mt-6 space-y-3">
              {(selectedCampanha.inscricoes_campanha || []).length === 0 ? <p className="text-center text-muted-foreground py-8">Sem inscrições</p> :
                selectedCampanha.inscricoes_campanha?.map(i => (
                  <div key={i.id} className="flex gap-3 p-3 rounded-lg border bg-muted/30 items-center">
                    <div className="p-2 rounded-full bg-primary/10"><UserPlus className="w-4 h-4 text-primary" /></div>
                    <div className="flex-1"><p className="font-medium text-sm">{i.nome_visitante}</p><p className="text-xs text-muted-foreground">{i.telefone || '-'}</p></div>
                    <span className="text-xs text-muted-foreground">{format(parseISO(i.created_at), 'dd/MM/yy', { locale: ptBR })}</span>
                  </div>
                ))
              }
            </div>
          </>}
        </SheetContent>
      </Sheet>
    </div>
  );
}
