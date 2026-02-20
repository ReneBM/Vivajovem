import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Plus, Search, Users, Loader2, MoreHorizontal, Edit, Trash2,
  Eye, Layers, UserCheck, UserPlus,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NucleoMembro {
  id: string;
  lider_id: string | null;
  jovem_id: string | null;
  nome_externo: string | null;
  tipo_membro: 'lider' | 'jovem' | 'externo';
  lideres?: { id: string; nome: string; foto_url: string | null } | null;
  jovens?: { id: string; nome: string; foto_url: string | null } | null;
}

interface Nucleo {
  id: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  created_at: string;
  membros?: NucleoMembro[];
}

interface Pessoa {
  id: string;
  nome: string;
  foto_url: string | null;
}

// Selected member for the form
interface SelectedMember {
  tipo: 'lider' | 'jovem' | 'externo';
  id?: string; // for lider/jovem
  nome?: string; // for externo
}

export default function NucleosTab() {
  const [nucleos, setNucleos] = useState<Nucleo[]>([]);
  const [lideres, setLideres] = useState<Pessoa[]>([]);
  const [jovens, setJovens] = useState<Pessoa[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingNucleo, setEditingNucleo] = useState<Nucleo | null>(null);
  const [selectedNucleo, setSelectedNucleo] = useState<Nucleo | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [memberSearch, setMemberSearch] = useState('');
  const [nomeExterno, setNomeExterno] = useState('');

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    selectedMembers: [] as SelectedMember[],
  });

  useEffect(() => {
    fetchNucleos();
    fetchLideres();
    fetchJovens();
  }, []);

  async function fetchNucleos() {
    try {
      const { data, error } = await supabase
        .from('nucleos')
        .select('*, membros:nucleo_membros(id, lider_id, jovem_id, nome_externo, tipo_membro, lideres(id, nome, foto_url), jovens(id, nome, foto_url))')
        .order('nome');
      if (error) throw error;
      setNucleos(data || []);
    } catch (error) {
      toast.error('Erro ao carregar núcleos');
    } finally {
      setLoading(false);
    }
  }

  async function fetchLideres() {
    const { data } = await supabase.from('lideres').select('id, nome, foto_url').eq('status', 'ATIVO').order('nome');
    setLideres(data || []);
  }

  async function fetchJovens() {
    const { data } = await supabase.from('jovens').select('id, nome, foto_url').eq('status', 'ATIVO').order('nome');
    setJovens(data || []);
  }

  function resetForm() {
    setFormData({ nome: '', descricao: '', selectedMembers: [] });
    setEditingNucleo(null);
    setMemberSearch('');
    setNomeExterno('');
  }

  function openEditDialog(nucleo: Nucleo) {
    setEditingNucleo(nucleo);
    const members: SelectedMember[] = (nucleo.membros || []).map(m => {
      if (m.tipo_membro === 'lider' && m.lider_id) return { tipo: 'lider' as const, id: m.lider_id };
      if (m.tipo_membro === 'jovem' && m.jovem_id) return { tipo: 'jovem' as const, id: m.jovem_id };
      return { tipo: 'externo' as const, nome: m.nome_externo || '' };
    });
    setFormData({ nome: nucleo.nome, descricao: nucleo.descricao || '', selectedMembers: members });
    setMemberSearch('');
    setNomeExterno('');
    setIsDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let nucleoId: string;

      if (editingNucleo) {
        const { error } = await supabase.from('nucleos').update({ nome: formData.nome, descricao: formData.descricao || null }).eq('id', editingNucleo.id);
        if (error) throw error;
        nucleoId = editingNucleo.id;
        await supabase.from('nucleo_membros').delete().eq('nucleo_id', editingNucleo.id);
      } else {
        const { data, error } = await supabase.from('nucleos').insert([{ nome: formData.nome, descricao: formData.descricao || null }]).select().single();
        if (error) throw error;
        nucleoId = data.id;
      }

      // Insert members
      if (formData.selectedMembers.length > 0) {
        const membrosData = formData.selectedMembers.map(m => ({
          nucleo_id: nucleoId,
          tipo_membro: m.tipo,
          lider_id: m.tipo === 'lider' ? m.id : null,
          jovem_id: m.tipo === 'jovem' ? m.id : null,
          nome_externo: m.tipo === 'externo' ? m.nome : null,
        }));
        const { error: membrosError } = await supabase.from('nucleo_membros').insert(membrosData);
        if (membrosError) throw membrosError;
      }

      toast.success(editingNucleo ? 'Núcleo atualizado!' : 'Núcleo criado!');
      setIsDialogOpen(false);
      resetForm();
      fetchNucleos();
    } catch (error) {
      toast.error('Erro ao salvar núcleo');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      const { error } = await supabase.from('nucleos').delete().eq('id', deleteId);
      if (error) throw error;
      toast.success('Núcleo excluído com sucesso');
      fetchNucleos();
      if (selectedNucleo?.id === deleteId) { setIsSheetOpen(false); setSelectedNucleo(null); }
    } catch (error) {
      toast.error('Erro ao excluir núcleo');
    } finally {
      setDeleteId(null);
    }
  }

  function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  function togglePessoa(tipo: 'lider' | 'jovem', id: string) {
    setFormData(prev => {
      const exists = prev.selectedMembers.some(m => m.tipo === tipo && m.id === id);
      return {
        ...prev,
        selectedMembers: exists
          ? prev.selectedMembers.filter(m => !(m.tipo === tipo && m.id === id))
          : [...prev.selectedMembers, { tipo, id }],
      };
    });
  }

  function addExterno() {
    if (!nomeExterno.trim()) return;
    setFormData(prev => ({
      ...prev,
      selectedMembers: [...prev.selectedMembers, { tipo: 'externo', nome: nomeExterno.trim() }],
    }));
    setNomeExterno('');
  }

  function removeExterno(index: number) {
    setFormData(prev => ({
      ...prev,
      selectedMembers: prev.selectedMembers.filter((_, i) => i !== index),
    }));
  }

  function getMembroNome(m: NucleoMembro): string {
    if (m.tipo_membro === 'lider') return m.lideres?.nome || 'Líder';
    if (m.tipo_membro === 'jovem') return m.jovens?.nome || 'Jovem';
    return m.nome_externo || 'Externo';
  }

  function getMembroFoto(m: NucleoMembro): string | null {
    if (m.tipo_membro === 'lider') return m.lideres?.foto_url || null;
    if (m.tipo_membro === 'jovem') return m.jovens?.foto_url || null;
    return null;
  }

  const TIPO_LABELS: Record<string, string> = { lider: 'Líder', jovem: 'Jovem', externo: 'Externo' };
  const TIPO_COLORS: Record<string, string> = {
    lider: 'bg-blue-500/10 text-blue-600',
    jovem: 'bg-green-500/10 text-green-600',
    externo: 'bg-orange-500/10 text-orange-600',
  };

  const filteredNucleos = nucleos.filter(n => n.nome.toLowerCase().includes(searchTerm.toLowerCase()));

  const filteredLideres = lideres.filter(l => l.nome.toLowerCase().includes(memberSearch.toLowerCase()));
  const filteredJovens = jovens.filter(j => j.nome.toLowerCase().includes(memberSearch.toLowerCase()));

  const membrosCount = (n: Nucleo) => n.membros?.length || 0;

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar núcleo..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button variant="hero"><Plus className="w-4 h-4" />Novo Núcleo</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">{editingNucleo ? 'Editar Núcleo' : 'Criar Núcleo'}</DialogTitle>
              <DialogDescription>Configure o núcleo e seus membros</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome do núcleo *</Label>
                  <Input value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} placeholder="Ex: Núcleo de Louvor" required />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} placeholder="Propósito do núcleo" />
                </div>
              </div>

              {/* Selected members chips */}
              {formData.selectedMembers.length > 0 && (
                <div className="space-y-2">
                  <Label>Membros selecionados ({formData.selectedMembers.length})</Label>
                  <div className="flex flex-wrap gap-2">
                    {formData.selectedMembers.map((m, i) => {
                      let nome = '';
                      if (m.tipo === 'lider') nome = lideres.find(l => l.id === m.id)?.nome || '';
                      else if (m.tipo === 'jovem') nome = jovens.find(j => j.id === m.id)?.nome || '';
                      else nome = m.nome || '';
                      return (
                        <Badge key={`${m.tipo}-${m.id || m.nome}-${i}`} variant="secondary" className="flex items-center gap-1.5 py-1 px-2.5">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${TIPO_COLORS[m.tipo]}`}>{TIPO_LABELS[m.tipo]}</span>
                          {nome}
                          <button type="button"
                            onClick={() => m.tipo === 'externo' ? removeExterno(i) : togglePessoa(m.tipo, m.id!)}
                            className="ml-1 text-muted-foreground hover:text-destructive">×</button>
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Member selection with tabs */}
              <div className="space-y-2">
                <Label>Adicionar membros</Label>
                <Tabs defaultValue="lideres" className="border rounded-lg">
                  <TabsList className="w-full grid grid-cols-3 rounded-b-none">
                    <TabsTrigger value="lideres">Líderes</TabsTrigger>
                    <TabsTrigger value="jovens">Jovens</TabsTrigger>
                    <TabsTrigger value="externo">Externo</TabsTrigger>
                  </TabsList>

                  <div className="p-2 border-b">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input placeholder="Buscar..." value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} className="pl-10 border-0 focus-visible:ring-0" />
                    </div>
                  </div>

                  <TabsContent value="lideres" className="mt-0">
                    <ScrollArea className="max-h-[200px]">
                      <div className="p-1">
                        {filteredLideres.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">Nenhum líder encontrado</p>
                        ) : filteredLideres.map(lider => (
                          <div key={lider.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer" onClick={() => togglePessoa('lider', lider.id)}>
                            <Checkbox checked={formData.selectedMembers.some(m => m.tipo === 'lider' && m.id === lider.id)} />
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={lider.foto_url || undefined} />
                              <AvatarFallback className="text-xs bg-blue-500/10 text-blue-600">{getInitials(lider.nome)}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{lider.nome}</span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="jovens" className="mt-0">
                    <ScrollArea className="max-h-[200px]">
                      <div className="p-1">
                        {filteredJovens.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">Nenhum jovem encontrado</p>
                        ) : filteredJovens.map(jovem => (
                          <div key={jovem.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer" onClick={() => togglePessoa('jovem', jovem.id)}>
                            <Checkbox checked={formData.selectedMembers.some(m => m.tipo === 'jovem' && m.id === jovem.id)} />
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={jovem.foto_url || undefined} />
                              <AvatarFallback className="text-xs bg-green-500/10 text-green-600">{getInitials(jovem.nome)}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{jovem.nome}</span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="externo" className="mt-0">
                    <div className="p-3 space-y-3">
                      <p className="text-sm text-muted-foreground">Adicione pessoas que não estão cadastradas no sistema</p>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Nome da pessoa..."
                          value={nomeExterno}
                          onChange={(e) => setNomeExterno(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addExterno())}
                        />
                        <Button type="button" variant="outline" onClick={addExterno} disabled={!nomeExterno.trim()}>
                          <UserPlus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>Cancelar</Button>
                <Button type="submit" variant="hero" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingNucleo ? 'Atualizar' : 'Criar Núcleo'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Núcleo</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : filteredNucleos.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Layers className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold text-foreground">Nenhum núcleo encontrado</h3>
            <p className="text-sm text-muted-foreground mt-1">{searchTerm ? 'Tente ajustar a busca' : 'Comece criando o primeiro núcleo'}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNucleos.map((nucleo, index) => (
            <Card key={nucleo.id} className="glass-card animate-slide-up opacity-0 hover:shadow-lg transition-shadow cursor-pointer"
              style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'forwards' }}
              onClick={() => { setSelectedNucleo(nucleo); setIsSheetOpen(true); }}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10"><Layers className="w-5 h-5 text-primary" /></div>
                    <div>
                      <CardTitle className="text-lg font-display">{nucleo.nome}</CardTitle>
                      <Badge variant={nucleo.ativo ? 'default' : 'secondary'} className={nucleo.ativo ? 'bg-success/10 text-success hover:bg-success/20 mt-1' : 'mt-1'}>
                        {nucleo.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}><MoreHorizontal className="w-4 h-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedNucleo(nucleo); setIsSheetOpen(true); }}>
                        <Eye className="w-4 h-4 mr-2" />Detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditDialog(nucleo); }}>
                        <Edit className="w-4 h-4 mr-2" />Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(nucleo.id); }}>
                        <Trash2 className="w-4 h-4 mr-2" />Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                {nucleo.descricao && <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{nucleo.descricao}</p>}
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{membrosCount(nucleo)} membros</span>
                  </div>
                  {/* Type badges */}
                  <div className="flex gap-1">
                    {['lider', 'jovem', 'externo'].map(tipo => {
                      const count = nucleo.membros?.filter(m => m.tipo_membro === tipo).length || 0;
                      if (count === 0) return null;
                      return (
                        <Badge key={tipo} variant="outline" className={`text-[10px] ${TIPO_COLORS[tipo]}`}>
                          {count} {TIPO_LABELS[tipo]}{count > 1 ? 's' : ''}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selectedNucleo && (
            <>
              <SheetHeader>
                <SheetTitle className="font-display text-xl flex items-center gap-3">
                  <Layers className="w-6 h-6 text-primary" />
                  {selectedNucleo.nome}
                </SheetTitle>
                <SheetDescription>{selectedNucleo.descricao || 'Sem descrição'}</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                {/* Members grouped by type */}
                {(['lider', 'jovem', 'externo'] as const).map(tipo => {
                  const membros = selectedNucleo.membros?.filter(m => m.tipo_membro === tipo) || [];
                  if (membros.length === 0) return null;
                  return (
                    <div key={tipo}>
                      <h4 className="font-semibold text-foreground flex items-center gap-2 mb-3">
                        <Badge variant="outline" className={TIPO_COLORS[tipo]}>{TIPO_LABELS[tipo]}s</Badge>
                        <span className="text-sm text-muted-foreground">({membros.length})</span>
                      </h4>
                      <div className="space-y-2">
                        {membros.map(membro => (
                          <div key={membro.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={getMembroFoto(membro) || undefined} />
                              <AvatarFallback className={`text-xs ${TIPO_COLORS[tipo]}`}>{getInitials(getMembroNome(membro))}</AvatarFallback>
                            </Avatar>
                            <div>
                              <span className="font-medium">{getMembroNome(membro)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {(!selectedNucleo.membros || selectedNucleo.membros.length === 0) && (
                  <div className="text-center py-6 text-muted-foreground">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum membro neste núcleo</p>
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t">
                  <Button variant="outline" className="flex-1" onClick={() => { setIsSheetOpen(false); openEditDialog(selectedNucleo); }}>
                    <Edit className="w-4 h-4 mr-2" />Editar
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
