import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  FolderKanban,
  Users,
  UserCheck,
  Loader2,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  UserMinus,
  UserPlus,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Grupo {
  id: string;
  nome: string;
  descricao: string | null;
  lider_id: string | null;
  ativo: boolean;
  created_at: string;
  lideres?: { id: string; nome: string; foto_url: string | null } | null;
  jovens?: { id: string; nome: string; foto_url: string | null }[];
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

export default function GruposTab() {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [lideres, setLideres] = useState<Lider[]>([]);
  const [allJovens, setAllJovens] = useState<Jovem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingGrupo, setEditingGrupo] = useState<Grupo | null>(null);
  const [selectedGrupo, setSelectedGrupo] = useState<Grupo | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isAddJovemOpen, setIsAddJovemOpen] = useState(false);
  const [jovemSearch, setJovemSearch] = useState('');

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    lider_id: '',
  });

  useEffect(() => {
    fetchGrupos();
    fetchLideres();
    fetchAllJovens();
  }, []);

  async function fetchGrupos() {
    try {
      const { data, error } = await supabase
        .from('grupos')
        .select('*, lideres(id, nome, foto_url), jovens(id, nome, foto_url)')
        .order('nome');

      if (error) throw error;
      setGrupos(data || []);
    } catch (error) {
      console.error('Error fetching grupos:', error);
      toast.error('Erro ao carregar grupos');
    } finally {
      setLoading(false);
    }
  }

  async function fetchLideres() {
    try {
      const { data, error } = await supabase
        .from('lideres')
        .select('id, nome, foto_url')
        .eq('status', 'ATIVO')
        .order('nome');
      if (error) throw error;
      setLideres(data || []);
    } catch (error) {
      console.error('Error fetching lideres:', error);
    }
  }

  async function fetchAllJovens() {
    try {
      const { data, error } = await supabase
        .from('jovens')
        .select('id, nome, foto_url, grupo_id')
        .eq('status', 'ATIVO')
        .order('nome');
      if (error) throw error;
      setAllJovens(data || []);
    } catch (error) {
      console.error('Error fetching jovens:', error);
    }
  }

  function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  function resetForm() {
    setFormData({ nome: '', descricao: '', lider_id: '' });
    setEditingGrupo(null);
  }

  function openEditDialog(grupo: Grupo) {
    setEditingGrupo(grupo);
    setFormData({
      nome: grupo.nome,
      descricao: grupo.descricao || '',
      lider_id: grupo.lider_id || '',
    });
    setIsDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        nome: formData.nome,
        descricao: formData.descricao || null,
        lider_id: formData.lider_id || null,
      };

      if (editingGrupo) {
        const { error } = await supabase.from('grupos').update(payload).eq('id', editingGrupo.id);
        if (error) throw error;
        toast.success('Grupo atualizado com sucesso!');
      } else {
        const { error } = await supabase.from('grupos').insert([payload]);
        if (error) throw error;
        toast.success('Grupo criado com sucesso!');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchGrupos();
    } catch (error) {
      console.error('Error saving grupo:', error);
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
      if (selectedGrupo?.id === deleteId) {
        setIsSheetOpen(false);
        setSelectedGrupo(null);
      }
    } catch (error) {
      console.error('Error deleting grupo:', error);
      toast.error('Erro ao excluir grupo');
    } finally {
      setDeleteId(null);
    }
  }

  async function addJovemToGrupo(jovemId: string, grupoId: string) {
    try {
      const { error } = await supabase
        .from('jovens')
        .update({ grupo_id: grupoId })
        .eq('id', jovemId);
      if (error) throw error;
      toast.success('Jovem adicionado ao grupo!');
      fetchGrupos();
      fetchAllJovens();
      // Refresh selected grupo
      if (selectedGrupo?.id === grupoId) {
        const { data } = await supabase
          .from('grupos')
          .select('*, lideres(id, nome, foto_url), jovens(id, nome, foto_url)')
          .eq('id', grupoId)
          .single();
        if (data) setSelectedGrupo(data);
      }
    } catch (error) {
      toast.error('Erro ao adicionar jovem');
    }
  }

  async function removeJovemFromGrupo(jovemId: string, grupoId: string) {
    try {
      const { error } = await supabase
        .from('jovens')
        .update({ grupo_id: null })
        .eq('id', jovemId);
      if (error) throw error;
      toast.success('Jovem removido do grupo');
      fetchGrupos();
      fetchAllJovens();
      if (selectedGrupo?.id === grupoId) {
        const { data } = await supabase
          .from('grupos')
          .select('*, lideres(id, nome, foto_url), jovens(id, nome, foto_url)')
          .eq('id', grupoId)
          .single();
        if (data) setSelectedGrupo(data);
      }
    } catch (error) {
      toast.error('Erro ao remover jovem');
    }
  }

  function openDetailSheet(grupo: Grupo) {
    setSelectedGrupo(grupo);
    setIsSheetOpen(true);
  }

  const filteredGrupos = grupos.filter((grupo) =>
    grupo.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const availableJovens = allJovens.filter(
    j => !j.grupo_id || j.grupo_id !== selectedGrupo?.id
  ).filter(j => j.nome.toLowerCase().includes(jovemSearch.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button variant="hero">
              <Plus className="w-4 h-4" />
              Novo Grupo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="font-display">
                {editingGrupo ? 'Editar Grupo' : 'Criar Grupo'}
              </DialogTitle>
              <DialogDescription>
                {editingGrupo ? 'Atualize os dados do grupo' : 'Preencha os dados do novo grupo'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do grupo *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Grupo de Louvor"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descreva o propósito do grupo"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lider">Líder responsável</Label>
                <Select
                  value={formData.lider_id}
                  onValueChange={(value) => setFormData({ ...formData, lider_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um líder" />
                  </SelectTrigger>
                  <SelectContent>
                    {lideres.map((lider) => (
                      <SelectItem key={lider.id} value={lider.id}>
                        {lider.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                  Cancelar
                </Button>
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
            <AlertDialogDescription>
              Tem certeza que deseja excluir este grupo? Os jovens vinculados ficarão sem grupo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
            <p className="text-sm text-muted-foreground mt-1">
              {searchTerm ? 'Tente ajustar a busca' : 'Comece criando o primeiro grupo'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGrupos.map((grupo, index) => (
            <Card
              key={grupo.id}
              className="glass-card animate-slide-up opacity-0 hover:shadow-lg transition-shadow cursor-pointer"
              style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
              onClick={() => openDetailSheet(grupo)}
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
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openDetailSheet(grupo); }}>
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditDialog(grupo); }}>
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => { e.stopPropagation(); setDeleteId(grupo.id); }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                {grupo.descricao && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {grupo.descricao}
                  </p>
                )}
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{grupo.jovens?.length || 0} jovens</span>
                  </div>
                  {grupo.lideres && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <UserCheck className="w-4 h-4" />
                      <span>{grupo.lideres.nome}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selectedGrupo && (
            <>
              <SheetHeader>
                <SheetTitle className="font-display text-xl">{selectedGrupo.nome}</SheetTitle>
                <SheetDescription>
                  {selectedGrupo.descricao || 'Sem descrição'}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Líder */}
                <div>
                  <h4 className="font-semibold text-foreground flex items-center gap-2 mb-3">
                    <UserCheck className="w-4 h-4 text-primary" />
                    Líder Responsável
                  </h4>
                  {selectedGrupo.lideres ? (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={selectedGrupo.lideres.foto_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(selectedGrupo.lideres.nome)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{selectedGrupo.lideres.nome}</span>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhum líder atribuído</p>
                  )}
                </div>

                {/* Jovens */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      Jovens ({selectedGrupo.jovens?.length || 0})
                    </h4>
                    <Button size="sm" variant="outline" onClick={() => { setIsAddJovemOpen(true); setJovemSearch(''); }}>
                      <UserPlus className="w-4 h-4 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                  {selectedGrupo.jovens && selectedGrupo.jovens.length > 0 ? (
                    <div className="space-y-2">
                      {selectedGrupo.jovens.map((jovem) => (
                        <div key={jovem.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={jovem.foto_url || undefined} />
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {getInitials(jovem.nome)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="flex-1 text-sm font-medium">{jovem.nome}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => removeJovemFromGrupo(jovem.id, selectedGrupo.id)}
                          >
                            <UserMinus className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum jovem neste grupo
                    </p>
                  )}
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" className="flex-1" onClick={() => {
                    setIsSheetOpen(false);
                    openEditDialog(selectedGrupo);
                  }}>
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Add Jovem Dialog */}
      <Dialog open={isAddJovemOpen} onOpenChange={setIsAddJovemOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="font-display">Adicionar Jovem ao Grupo</DialogTitle>
            <DialogDescription>Selecione um jovem para adicionar ao grupo {selectedGrupo?.nome}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar jovem..."
                value={jovemSearch}
                onChange={(e) => setJovemSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <ScrollArea className="max-h-[300px]">
              <div className="space-y-1">
                {availableJovens.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhum jovem disponível</p>
                ) : (
                  availableJovens.map((jovem) => (
                    <button
                      key={jovem.id}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/50 transition-colors text-left"
                      onClick={() => {
                        if (selectedGrupo) {
                          addJovemToGrupo(jovem.id, selectedGrupo.id);
                          setIsAddJovemOpen(false);
                        }
                      }}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={jovem.foto_url || undefined} />
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {getInitials(jovem.nome)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{jovem.nome}</span>
                      {jovem.grupo_id && (
                        <Badge variant="secondary" className="ml-auto text-xs">Em outro grupo</Badge>
                      )}
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
