
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

import { Button } from '@/components/ui/button';
import PermissionChecklist from '@/features/funcoes/components/PermissionChecklist';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Plus,
  Shield,
  Loader2,
  Edit,
  Trash2,
  Check,
  Search,
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Role {
  id: string;
  nome: string;
  descricao: string | null;
  permissoes: string[];
  cor: string;
  created_at: string;
  atribuivel_por: string[];
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  LIDER: 'Líder',
  USUARIO: 'Usuário',
};

export default function Funcoes() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    permissoes: [] as string[],
    cor: '#7C3AED',
    atribuivel_por: [] as string[],
  });

  useEffect(() => { fetchRoles(); }, []);

  async function fetchRoles() {
    try {
      const { data, error } = await supabase.from('roles').select('*').order('nome');
      if (error) throw error;
      setRoles((data as Role[]) || []);
    } catch (error) {
      toast.error('Erro ao carregar funções');
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormData({ nome: '', descricao: '', permissoes: [], cor: '#7C3AED', atribuivel_por: [] });
    setEditingRole(null);
  }

  function openEditDialog(role: Role) {
    setEditingRole(role);
    setFormData({
      nome: role.nome,
      descricao: role.descricao || '',
      permissoes: role.permissoes || [],
      cor: role.cor || '#7C3AED',
      atribuivel_por: (role.atribuivel_por || []) as string[],
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
        permissoes: formData.permissoes,
        cor: formData.cor,
        atribuivel_por: formData.atribuivel_por,
      };

      if (editingRole) {
        const { error } = await supabase.from('roles').update(payload).eq('id', editingRole.id);
        if (error) throw error;
        toast.success('Função atualizada com sucesso!');
      } else {
        const { error } = await supabase.from('roles').insert(payload);
        if (error) throw error;
        toast.success('Função criada com sucesso!');
      }
      setIsDialogOpen(false);
      resetForm();
      fetchRoles();
    } catch (error: any) {
      if (error.code === '23505') toast.error('Já existe uma função com esse nome.');
      else toast.error('Erro ao salvar função');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      const { error } = await supabase.from('roles').delete().eq('id', deleteId);
      if (error) throw error;
      toast.success('Função excluída com sucesso');
      fetchRoles();
    } catch (error) {
      toast.error('Erro ao excluir função');
    } finally {
      setDeleteId(null);
    }
  }

  type AppRole = 'ADMIN' | 'LIDER' | 'USUARIO';

  function toggleAtribuivelPor(roleName: string) {
    setFormData(prev => ({
      ...prev,
      atribuivel_por: prev.atribuivel_por.includes(roleName)
        ? prev.atribuivel_por.filter(r => r !== roleName)
        : [...prev.atribuivel_por, roleName],
    }));
  }

  const filteredRoles = roles.filter(r => r.nome.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            Funções
          </h1>
          <p className="text-muted-foreground mt-1">Gerencie funções e acessos do sistema</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button variant="hero"><Plus className="w-4 h-4" />Nova Função</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">{editingRole ? 'Editar Função' : 'Nova Função'}</DialogTitle>
              <DialogDescription>Configure os acessos para esta função usando o checklist abaixo</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label>Nome da função *</Label>
                  <Input value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} placeholder="Ex: Líder" required />
                </div>
                <div className="space-y-2">
                  <Label>Cor</Label>
                  <div className="flex gap-2">
                    <Input type="color" value={formData.cor} onChange={(e) => setFormData({ ...formData, cor: e.target.value })} className="w-14 h-10 p-1 cursor-pointer" />
                    <Input value={formData.cor} onChange={(e) => setFormData({ ...formData, cor: e.target.value })} className="flex-1" />
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <Label>Descrição</Label>
                <Textarea value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} placeholder="Descreva as responsabilidades desta função" rows={2} />
              </div>

              <div className="space-y-2 mb-4">
                <Label>Quem pode atribuir esta função</Label>
                <div className="flex flex-wrap gap-2">
                  {roles
                    .filter((r) => !editingRole || r.id !== editingRole.id)
                    .map((r) => (
                      <button key={r.id} type="button" onClick={() => toggleAtribuivelPor(r.nome)}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${formData.atribuivel_por.includes(r.nome) ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-input hover:bg-muted/50'}`}>
                        <span className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.cor }} />
                          {r.nome}
                        </span>
                      </button>
                    ))}
                </div>
                <p className="text-xs text-muted-foreground">Selecione quais funções podem atribuir esta função a outros usuários</p>
              </div>

              <div className="space-y-2">
                <Label>Acessos ({formData.permissoes.length} selecionados)</Label>
                <div className="border rounded-lg p-3 max-h-[40vh] overflow-y-auto">
                  <PermissionChecklist selected={formData.permissoes} onChange={(perms) => setFormData({ ...formData, permissoes: perms })} accentColor={formData.cor} />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>Cancelar</Button>
                <Button type="submit" variant="hero" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingRole ? 'Atualizar' : 'Criar Função'}
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
            <AlertDialogTitle>Excluir Função</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir esta função? Esta ação não pode ser desfeita e os usuários vinculados perderão os acessos.</AlertDialogDescription>
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
        <Input placeholder="Buscar função..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
      </div>

      {/* Roles List (Table format) */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredRoles.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Shield className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold text-foreground">Nenhuma função encontrada</h3>
            <p className="text-sm text-muted-foreground mt-1">{searchTerm ? 'Tente ajustar a busca' : 'Comece criando a primeira função'}</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="glass-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Função</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Atribuível por</TableHead>
                <TableHead>Acessos</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: role.cor }} />
                      <span className="font-medium">{role.nome}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-[200px] truncate">
                    {role.descricao || '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(role.atribuivel_por || []).length > 0 ? (
                        (role.atribuivel_por || []).map((r: string) => {
                          const matchedRole = roles.find(rl => rl.nome === r);
                          return (
                            <Badge key={r} variant="outline" className="text-xs flex items-center gap-1.5">
                              {matchedRole && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: matchedRole.cor }} />}
                              {r}
                            </Badge>
                          );
                        })
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">{role.permissoes?.length || 0} acessos</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(role)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(role.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
