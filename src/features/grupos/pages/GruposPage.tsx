import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';
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
import { toast } from 'sonner';
import {
  Plus, Search, FolderKanban, Users, UserCheck, Loader2,
  MoreHorizontal, Edit, Trash2, Eye, UserPlus, UserMinus,
  MessageSquarePlus, Send, ChevronDown, ChevronRight,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface GrupoLider {
  id: string;
  lider_id: string;
  lideres: { id: string; nome: string; foto_url: string | null };
}

interface Grupo {
  id: string;
  nome: string;
  descricao: string | null;
  lider_id: string | null;
  ativo: boolean;
  created_at: string;
  lideres?: { nome: string } | null;
  jovens?: { id: string }[];
  grupo_lideres?: GrupoLider[];
}

interface Lider {
  id: string;
  nome: string;
  foto_url: string | null;
}

interface Jovem {
  id: string;
  nome: string;
  foto_url: string | null;
  grupo_id: string | null;
}

interface Observacao {
  id: string;
  grupo_id: string;
  jovem_id: string;
  texto: string;
  created_at: string;
  created_by: string | null;
}

export default function Grupos() {
  const { user } = useAuth();
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [lideres, setLideres] = useState<Lider[]>([]);
  const [allJovens, setAllJovens] = useState<Jovem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingGrupo, setEditingGrupo] = useState<Grupo | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Detail sheet
  const [selectedGrupo, setSelectedGrupo] = useState<Grupo | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [observacoes, setObservacoes] = useState<Observacao[]>([]);
  const [expandedJovem, setExpandedJovem] = useState<string | null>(null);
  const [newObsText, setNewObsText] = useState('');
  const [addMemberSearch, setAddMemberSearch] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    selectedLideres: [] as string[],
  });
  const [memberSearch, setMemberSearch] = useState('');

  useEffect(() => {
    fetchGrupos();
    fetchLideres();
    fetchAllJovens();
  }, []);

  async function fetchGrupos() {
    try {
      const { data, error } = await supabase
        .from('grupos')
        .select('*, lideres(nome), jovens(id), grupo_lideres(id, lider_id, lideres(id, nome, foto_url))')
        .order('nome');
      if (error) throw error;
      setGrupos(data || []);
    } catch (error) {
      toast.error('Erro ao carregar grupos');
    } finally {
      setLoading(false);
    }
  }

  async function fetchLideres() {
    const { data } = await supabase.from('lideres').select('id, nome, foto_url').eq('status', 'ATIVO').order('nome');
    setLideres(data || []);
  }

  async function fetchAllJovens() {
    const { data } = await supabase.from('jovens').select('id, nome, foto_url, grupo_id').eq('status', 'ATIVO').order('nome');
    setAllJovens(data || []);
  }

  function resetForm() {
    setFormData({ nome: '', descricao: '', selectedLideres: [] });
    setEditingGrupo(null);
    setMemberSearch('');
  }

  function openEditDialog(grupo: Grupo) {
    setEditingGrupo(grupo);
    setFormData({
      nome: grupo.nome,
      descricao: grupo.descricao || '',
      selectedLideres: grupo.grupo_lideres?.map(gl => gl.lider_id) || (grupo.lider_id ? [grupo.lider_id] : []),
    });
    setMemberSearch('');
    setIsDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let grupoId: string;
      const payload = {
        nome: formData.nome,
        descricao: formData.descricao || null,
        lider_id: formData.selectedLideres[0] || null,
      };

      if (editingGrupo) {
        const { error } = await supabase.from('grupos').update(payload).eq('id', editingGrupo.id);
        if (error) throw error;
        grupoId = editingGrupo.id;
        // Remove old grupo_lideres
        await supabase.from('grupo_lideres').delete().eq('grupo_id', editingGrupo.id);
      } else {
        const { data, error } = await supabase.from('grupos').insert([payload]).select().single();
        if (error) throw error;
        grupoId = data.id;
      }

      // Insert new grupo_lideres
      if (formData.selectedLideres.length > 0) {
        const lideresData = formData.selectedLideres.map(lid => ({ grupo_id: grupoId, lider_id: lid }));
        await supabase.from('grupo_lideres').insert(lideresData);
      }

      toast.success(editingGrupo ? 'Grupo atualizado!' : 'Grupo criado!');
      setIsDialogOpen(false);
      resetForm();
      fetchGrupos();
    } catch (error) {
      toast.error('Erro ao salvar grupo');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      const { error } = await supabase.from('grupos').delete().eq('id', deleteId);
      if (error) throw error;
      toast.success('Grupo excluído com sucesso');
      fetchGrupos();
      if (selectedGrupo?.id === deleteId) { setIsSheetOpen(false); setSelectedGrupo(null); }
    } catch (error) {
      toast.error('Erro ao excluir grupo');
    } finally {
      setDeleteId(null);
    }
  }

  function toggleLider(id: string) {
    setFormData(prev => ({
      ...prev,
      selectedLideres: prev.selectedLideres.includes(id)
        ? prev.selectedLideres.filter(l => l !== id)
        : [...prev.selectedLideres, id],
    }));
  }

  // ── Detail Sheet functions ──
  async function openDetail(grupo: Grupo) {
    setSelectedGrupo(grupo);
    setIsSheetOpen(true);
    setExpandedJovem(null);
    setNewObsText('');
    setAddMemberSearch('');
    setIsAddingMember(false);
    await fetchObservacoes(grupo.id);
  }

  async function fetchObservacoes(grupoId: string) {
    const { data } = await supabase
      .from('grupo_observacoes')
      .select('*')
      .eq('grupo_id', grupoId)
      .order('created_at', { ascending: false });
    setObservacoes(data || []);
  }

  async function addJovemToGrupo(jovemId: string) {
    if (!selectedGrupo) return;
    const { error } = await supabase.from('jovens').update({ grupo_id: selectedGrupo.id }).eq('id', jovemId);
    if (error) { toast.error('Erro ao adicionar jovem'); return; }
    toast.success('Jovem adicionado ao grupo!');
    fetchGrupos();
    fetchAllJovens();
  }

  async function removeJovemFromGrupo(jovemId: string) {
    const { error } = await supabase.from('jovens').update({ grupo_id: null }).eq('id', jovemId);
    if (error) { toast.error('Erro ao remover jovem'); return; }
    toast.success('Jovem removido do grupo');
    fetchGrupos();
    fetchAllJovens();
  }

  async function addObservacao(jovemId: string) {
    if (!selectedGrupo || !newObsText.trim()) return;
    const { error } = await supabase.from('grupo_observacoes').insert({
      grupo_id: selectedGrupo.id,
      jovem_id: jovemId,
      texto: newObsText.trim(),
      created_by: user?.id || null,
    });
    if (error) { toast.error('Erro ao salvar observação'); return; }
    toast.success('Observação adicionada!');
    setNewObsText('');
    await fetchObservacoes(selectedGrupo.id);
  }

  function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  // ── Filtered data ──
  const filteredGrupos = grupos.filter(g => g.nome.toLowerCase().includes(searchTerm.toLowerCase()));

  const filteredLideres = lideres.filter(l =>
    l.nome.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const membrosDoGrupo = allJovens.filter(j => j.grupo_id === selectedGrupo?.id);
  const jovensDisponiveis = allJovens.filter(j =>
    !j.grupo_id && j.nome.toLowerCase().includes(addMemberSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <FolderKanban className="w-8 h-8 text-primary" />
            Grupos
          </h1>
          <p className="text-muted-foreground mt-1">
            Organize os jovens em grupos de acompanhamento
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button variant="hero"><Plus className="w-4 h-4" />Novo Grupo</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">{editingGrupo ? 'Editar Grupo' : 'Criar Grupo'}</DialogTitle>
              <DialogDescription>{editingGrupo ? 'Atualize os dados do grupo' : 'Preencha os dados do novo grupo'}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome do grupo *</Label>
                  <Input value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} placeholder="Ex: Grupo Esperança" required />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} placeholder="Propósito do grupo" />
                </div>
              </div>

              {/* Líderes responsáveis */}
              <div className="space-y-2">
                <Label>Líderes responsáveis</Label>
                {formData.selectedLideres.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.selectedLideres.map(lid => {
                      const lider = lideres.find(l => l.id === lid);
                      if (!lider) return null;
                      return (
                        <Badge key={lid} variant="secondary" className="flex items-center gap-1.5 py-1 px-2.5">
                          <Avatar className="w-5 h-5">
                            <AvatarImage src={lider.foto_url || undefined} />
                            <AvatarFallback className="text-[10px]">{getInitials(lider.nome)}</AvatarFallback>
                          </Avatar>
                          {lider.nome}
                          <button type="button" onClick={() => toggleLider(lid)} className="ml-1 text-muted-foreground hover:text-destructive">×</button>
                        </Badge>
                      );
                    })}
                  </div>
                )}
                <Input
                  placeholder="Buscar líder..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="text-sm"
                />
                <div className="border rounded-lg max-h-40 overflow-y-auto">
                  {filteredLideres.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-3">Nenhum líder encontrado</p>
                  ) : (
                    filteredLideres.map(lider => (
                      <div key={lider.id}
                        className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors hover:bg-muted/50 ${formData.selectedLideres.includes(lider.id) ? 'bg-primary/5' : ''}`}
                        onClick={() => toggleLider(lider.id)}
                      >
                        <Avatar className="w-7 h-7">
                          <AvatarImage src={lider.foto_url || undefined} />
                          <AvatarFallback className="text-xs">{getInitials(lider.nome)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm flex-1">{lider.nome}</span>
                        {formData.selectedLideres.includes(lider.id) && (
                          <Badge variant="default" className="text-xs">Selecionado</Badge>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>Cancelar</Button>
                <Button type="submit" variant="hero" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingGrupo ? 'Atualizar' : 'Criar Grupo'}
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
            <AlertDialogTitle>Excluir Grupo</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza? Os jovens vinculados perderão a associação.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar grupo..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredGrupos.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FolderKanban className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold text-foreground">Nenhum grupo encontrado</h3>
            <p className="text-sm text-muted-foreground mt-1">{searchTerm ? 'Tente ajustar a busca' : 'Comece criando o primeiro grupo'}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGrupos.map((grupo, index) => (
            <Card
              key={grupo.id}
              className="glass-card animate-slide-up opacity-0 hover:shadow-lg transition-shadow cursor-pointer"
              style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'forwards' }}
              onClick={() => openDetail(grupo)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-accent/10">
                      <FolderKanban className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-display">{grupo.nome}</CardTitle>
                      <Badge
                        variant={grupo.ativo ? 'default' : 'secondary'}
                        className={grupo.ativo ? 'bg-success/10 text-success hover:bg-success/20 mt-1' : 'mt-1'}
                      >
                        {grupo.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openDetail(grupo); }}>
                        <Eye className="w-4 h-4 mr-2" />Detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditDialog(grupo); }}>
                        <Edit className="w-4 h-4 mr-2" />Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(grupo.id); }}>
                        <Trash2 className="w-4 h-4 mr-2" />Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                {grupo.descricao && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{grupo.descricao}</p>
                )}
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{grupo.jovens?.length || 0} jovens</span>
                  </div>
                  {/* Avatar stack dos líderes */}
                  {grupo.grupo_lideres && grupo.grupo_lideres.length > 0 ? (
                    <div className="flex items-center gap-1.5">
                      <div className="flex -space-x-2">
                        {grupo.grupo_lideres.slice(0, 3).map(gl => (
                          <Avatar key={gl.id} className="w-6 h-6 border-2 border-background">
                            <AvatarImage src={gl.lideres?.foto_url || undefined} />
                            <AvatarFallback className="text-[9px]">{getInitials(gl.lideres?.nome || '')}</AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {grupo.grupo_lideres.length === 1 ? grupo.grupo_lideres[0].lideres?.nome : `${grupo.grupo_lideres.length} líderes`}
                      </span>
                    </div>
                  ) : grupo.lideres ? (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <UserCheck className="w-4 h-4" />
                      <span>{grupo.lideres.nome}</span>
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ══ Detail Sheet ══ */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-[550px] overflow-y-auto">
          {selectedGrupo && (
            <>
              <SheetHeader>
                <SheetTitle className="font-display text-xl flex items-center gap-3">
                  <FolderKanban className="w-6 h-6 text-primary" />
                  {selectedGrupo.nome}
                </SheetTitle>
                <SheetDescription>{selectedGrupo.descricao || 'Sem descrição'}</SheetDescription>
              </SheetHeader>

              {/* Líderes responsáveis */}
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Líderes Responsáveis</h3>
                <div className="flex flex-wrap gap-2">
                  {(selectedGrupo.grupo_lideres && selectedGrupo.grupo_lideres.length > 0)
                    ? selectedGrupo.grupo_lideres.map(gl => (
                      <Badge key={gl.id} variant="secondary" className="flex items-center gap-2 py-1.5 px-3">
                        <Avatar className="w-5 h-5">
                          <AvatarImage src={gl.lideres?.foto_url || undefined} />
                          <AvatarFallback className="text-[10px]">{getInitials(gl.lideres?.nome || '')}</AvatarFallback>
                        </Avatar>
                        {gl.lideres?.nome}
                      </Badge>
                    ))
                    : selectedGrupo.lideres
                      ? <Badge variant="secondary">{selectedGrupo.lideres.nome}</Badge>
                      : <span className="text-sm text-muted-foreground">Nenhum líder atribuído</span>
                  }
                </div>
              </div>

              {/* Membros do grupo */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Membros ({membrosDoGrupo.length})
                  </h3>
                  <Button variant="outline" size="sm" onClick={() => setIsAddingMember(!isAddingMember)}>
                    <UserPlus className="w-4 h-4 mr-1" />
                    Adicionar
                  </Button>
                </div>

                {/* Adicionar membro */}
                {isAddingMember && (
                  <div className="mb-4 border rounded-lg p-3 bg-muted/30 space-y-2">
                    <Input
                      placeholder="Buscar jovem para adicionar..."
                      value={addMemberSearch}
                      onChange={(e) => setAddMemberSearch(e.target.value)}
                      className="text-sm"
                    />
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {jovensDisponiveis.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-2">
                          {addMemberSearch ? 'Nenhum jovem encontrado' : 'Todos os jovens já estão em grupos'}
                        </p>
                      ) : (
                        jovensDisponiveis.slice(0, 10).map(jovem => (
                          <div key={jovem.id}
                            className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => addJovemToGrupo(jovem.id)}
                          >
                            <Avatar className="w-7 h-7">
                              <AvatarImage src={jovem.foto_url || undefined} />
                              <AvatarFallback className="text-xs">{getInitials(jovem.nome)}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm flex-1">{jovem.nome}</span>
                            <Plus className="w-4 h-4 text-primary" />
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Lista de membros */}
                {membrosDoGrupo.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum jovem neste grupo</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {membrosDoGrupo.map(jovem => {
                      const jovemObs = observacoes.filter(o => o.jovem_id === jovem.id);
                      const isExpanded = expandedJovem === jovem.id;

                      return (
                        <div key={jovem.id} className="border rounded-lg overflow-hidden">
                          <div
                            className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/30 transition-colors"
                            onClick={() => setExpandedJovem(isExpanded ? null : jovem.id)}
                          >
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={jovem.foto_url || undefined} />
                              <AvatarFallback className="text-xs">{getInitials(jovem.nome)}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium flex-1">{jovem.nome}</span>
                            {jovemObs.length > 0 && (
                              <Badge variant="outline" className="text-xs mr-1">{jovemObs.length} obs.</Badge>
                            )}
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/70 hover:text-destructive"
                              onClick={(e) => { e.stopPropagation(); removeJovemFromGrupo(jovem.id); }}>
                              <UserMinus className="w-3.5 h-3.5" />
                            </Button>
                            {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                          </div>

                          {/* Observações expandidas */}
                          {isExpanded && (
                            <div className="border-t bg-muted/10 px-4 py-3 space-y-3">
                              <div className="flex items-center gap-2">
                                <MessageSquarePlus className="w-4 h-4 text-muted-foreground" />
                                <span className="text-xs font-semibold uppercase text-muted-foreground">Observações</span>
                              </div>

                              {jovemObs.length === 0 && (
                                <p className="text-xs text-muted-foreground italic">Nenhuma observação registrada</p>
                              )}

                              {jovemObs.map(obs => (
                                <div key={obs.id} className="bg-background rounded-md p-2.5 border text-sm">
                                  <p>{obs.texto}</p>
                                  <span className="text-xs text-muted-foreground mt-1 block">
                                    {new Date(obs.created_at).toLocaleDateString('pt-BR')} às {new Date(obs.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              ))}

                              {/* Nova observação */}
                              <div className="flex gap-2">
                                <Textarea
                                  placeholder="Adicionar observação..."
                                  value={expandedJovem === jovem.id ? newObsText : ''}
                                  onChange={(e) => setNewObsText(e.target.value)}
                                  rows={2}
                                  className="text-sm flex-1"
                                />
                                <Button variant="hero" size="icon" className="shrink-0 mt-auto"
                                  onClick={() => addObservacao(jovem.id)}
                                  disabled={!newObsText.trim()}>
                                  <Send className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
