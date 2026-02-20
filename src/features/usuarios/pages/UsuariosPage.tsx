import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  UserCog,
  Loader2,
  Edit,
  Eye,
  Phone,
  Mail,
  Shield,
  Check,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { z } from 'zod';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Profile {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  status: string;
  created_at: string;
  ultimo_acesso: string | null;
}

interface UserWithRole extends Profile {
  role?: string;
  customRoleNames?: string[];
  customRoleIds?: string[];
}

interface Jovem {
  id: string;
  nome: string;
  telefone: string | null;
  foto_url: string | null;
}

interface Lider {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  foto_url: string | null;
}

interface CustomRole {
  id: string;
  nome: string;
  cor: string;
  descricao: string | null;
}

const userFormSchema = z.object({
  tipo: z.enum(['JOVEM', 'LIDER']),
  selectedId: z.string().min(1, 'Selecione uma pessoa'),
  usuario: z.string().min(3, 'Usuário deve ter no mínimo 3 caracteres'),
  senha: z.string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Deve conter pelo menos 1 letra maiúscula')
    .regex(/[0-9]/, 'Deve conter pelo menos 1 número'),
  email: z.string().email('Email inválido'),
});

export default function Usuarios() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [jovens, setJovens] = useState<Jovem[]>([]);
  const [lideres, setLideres] = useState<Lider[]>([]);
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);
  const [editRoleIds, setEditRoleIds] = useState<string[]>([]);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [personSearch, setPersonSearch] = useState('');
  const [roleSearch, setRoleSearch] = useState('');

  const [formData, setFormData] = useState({
    tipo: '' as 'JOVEM' | 'LIDER' | '',
    selectedId: '',
    nome: '',
    telefone: '',
    usuario: '',
    senha: '',
    email: '',
    selectedRoleIds: [] as string[],
  });

  useEffect(() => {
    fetchUsers();
    fetchJovens();
    fetchLideres();
    fetchCustomRoles();
  }, []);

  async function fetchUsers() {
    try {
      const { data: profiles, error } = await supabase.from('profiles').select('*').order('nome');
      if (error) throw error;

      const usersWithRoles = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', profile.user_id).single();
          const { data: userCustomRoles } = await supabase.from('user_custom_roles').select('role_id, roles(nome)').eq('user_id', profile.user_id);
          const customRoleNames = (userCustomRoles || []).map((ucr: any) => ucr.roles?.nome).filter(Boolean);
          const customRoleIds = (userCustomRoles || []).map((ucr: any) => ucr.role_id).filter(Boolean);
          return { ...profile, role: roleData?.role || 'USUARIO', customRoleNames, customRoleIds };
        })
      );
      setUsers(usersWithRoles);
    } catch (error) {
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  }

  async function fetchJovens() {
    const { data } = await supabase.from('jovens').select('id, nome, telefone, foto_url').eq('status', 'ATIVO').order('nome');
    setJovens(data || []);
  }

  async function fetchLideres() {
    const { data } = await supabase.from('lideres').select('id, nome, telefone, email, foto_url').eq('status', 'ATIVO').order('nome');
    setLideres(data || []);
  }

  async function fetchCustomRoles() {
    const { data } = await supabase.from('roles').select('id, nome, cor, descricao').order('nome');
    setCustomRoles(data || []);
  }

  function handlePersonSelect(id: string) {
    if (formData.tipo === 'JOVEM') {
      const person = jovens.find(j => j.id === id);
      if (person) setFormData(prev => ({ ...prev, selectedId: id, nome: person.nome, telefone: person.telefone || '', email: '' }));
    } else {
      const person = lideres.find(l => l.id === id);
      if (person) setFormData(prev => ({ ...prev, selectedId: id, nome: person.nome, telefone: person.telefone || '', email: person.email || '' }));
    }
    setPersonSearch('');
  }

  function resetForm() {
    setFormData({ tipo: '', selectedId: '', nome: '', telefone: '', usuario: '', senha: '', email: '', selectedRoleIds: [] });
    setErrors({});
    setPersonSearch('');
    setRoleSearch('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      userFormSchema.parse({ tipo: formData.tipo, selectedId: formData.selectedId, usuario: formData.usuario, senha: formData.senha, email: formData.email });
      setErrors({});
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach((e) => { if (e.path[0]) newErrors[e.path[0] as string] = e.message; });
        setErrors(newErrors);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        toast.error('Sessão expirada. Faça login novamente.');
        return;
      }

      const { data, error: fnError } = await supabase.functions.invoke('create-user', {
        body: {
          email: formData.email,
          password: formData.senha,
          nome: formData.nome,
          role_ids: formData.selectedRoleIds,
        },
      });

      if (fnError) {
        const errorBody = typeof fnError === 'object' && 'context' in (fnError as any)
          ? await (fnError as any).context?.json?.() : null;
        const msg = errorBody?.error || fnError.message || 'Erro ao criar usuário';
        if (msg.includes('já está cadastrado') || msg.includes('already')) {
          toast.error('Este email já está cadastrado');
        } else {
          toast.error(msg);
        }
        return;
      }

      if (data?.error) {
        if (data.error.includes('já está cadastrado') || data.error.includes('already')) {
          toast.error('Este email já está cadastrado');
        } else {
          toast.error(data.error);
        }
        return;
      }

      toast.success('Usuário criado com sucesso!');
      setIsDialogOpen(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      toast.error('Erro ao criar usuário');
    } finally {
      setIsSubmitting(false);
    }
  }

  function openEditDialog(user: UserWithRole) {
    setEditingUser(user);
    setEditRoleIds(user.customRoleIds || []);
    setRoleSearch('');
    setIsEditDialogOpen(true);
  }

  async function handleSaveEdit() {
    if (!editingUser) return;
    setIsSavingEdit(true);
    try {
      await supabase.from('user_custom_roles').delete().eq('user_id', editingUser.user_id);
      if (editRoleIds.length > 0) {
        const roleInserts = editRoleIds.map(roleId => ({ user_id: editingUser.user_id, role_id: roleId }));
        const { error } = await supabase.from('user_custom_roles').insert(roleInserts);
        if (error) throw error;
      }
      toast.success('Funções atualizadas com sucesso!');
      setIsEditDialogOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      toast.error('Erro ao atualizar funções');
    } finally {
      setIsSavingEdit(false);
    }
  }

  function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  function getRoleBadges(user: UserWithRole) {
    const badges = [];
    if (user.role === 'ADMIN') badges.push(<Badge key="admin" className="bg-destructive/10 text-destructive">Admin</Badge>);
    if (user.customRoleNames && user.customRoleNames.length > 0) {
      user.customRoleNames.forEach((name) => {
        const role = customRoles.find(r => r.nome === name);
        badges.push(<Badge key={name} style={{ backgroundColor: `${role?.cor || '#7C3AED'}20`, color: role?.cor || '#7C3AED' }}>{name}</Badge>);
      });
    }
    if (badges.length === 0) badges.push(<Badge key="user" variant="secondary">Sem função</Badge>);
    return <div className="flex flex-wrap gap-1">{badges}</div>;
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.nome.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase());
    if (filterRole === 'all') return matchesSearch;
    if (filterRole === 'sem_funcao') return matchesSearch && (!user.customRoleNames || user.customRoleNames.length === 0) && user.role !== 'ADMIN';
    return matchesSearch && (user.customRoleNames?.includes(filterRole) || false);
  });

  const personOptions = formData.tipo === 'JOVEM' ? jovens : formData.tipo === 'LIDER' ? lideres : [];
  const filteredPersonOptions = personOptions.filter(p => p.nome.toLowerCase().includes(personSearch.toLowerCase()));
  const filteredRolesForForm = customRoles.filter(r => r.nome.toLowerCase().includes(roleSearch.toLowerCase()));
  const filteredRolesForEdit = customRoles.filter(r => r.nome.toLowerCase().includes(roleSearch.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <UserCog className="w-8 h-8 text-primary" />
            Usuários
          </h1>
          <p className="text-muted-foreground mt-1">Gerencie os usuários do sistema</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button variant="hero"><Plus className="w-4 h-4" />Novo Usuário</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">Criar Usuário</DialogTitle>
              <DialogDescription>O usuário deve estar previamente cadastrado como Jovem ou Líder</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select value={formData.tipo} onValueChange={(value: 'JOVEM' | 'LIDER') => {
                  setFormData(prev => ({ ...prev, tipo: value, selectedId: '', nome: '', telefone: '', email: '' }));
                  setPersonSearch('');
                }}>
                  <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="JOVEM">Jovem</SelectItem>
                    <SelectItem value="LIDER">Líder</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.tipo && (
                <div className="space-y-2">
                  <Label>Selecionar {formData.tipo === 'JOVEM' ? 'Jovem' : 'Líder'} *</Label>
                  {formData.selectedId ? (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">{getInitials(formData.nome)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{formData.nome}</p>
                        {formData.telefone && <p className="text-xs text-muted-foreground">{formData.telefone}</p>}
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={() => { setFormData(prev => ({ ...prev, selectedId: '', nome: '', telefone: '', email: '' })); setPersonSearch(''); }}>Trocar</Button>
                    </div>
                  ) : (
                    <div className="border rounded-lg">
                      <div className="p-2 border-b">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input placeholder={`Buscar ${formData.tipo === 'JOVEM' ? 'jovem' : 'líder'}...`} value={personSearch} onChange={(e) => setPersonSearch(e.target.value)} className="pl-10 border-0 focus-visible:ring-0" />
                        </div>
                      </div>
                      <ScrollArea className="max-h-[200px]">
                        <div className="p-1">
                          {filteredPersonOptions.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">Nenhum resultado</p>
                          ) : filteredPersonOptions.map((person) => (
                            <button key={person.id} type="button" className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/50 transition-colors text-left" onClick={() => handlePersonSelect(person.id)}>
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={person.foto_url || undefined} />
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">{getInitials(person.nome)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">{person.nome}</p>
                                {person.telefone && <p className="text-xs text-muted-foreground">{person.telefone}</p>}
                              </div>
                            </button>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </div>
              )}

              {formData.selectedId && (
                <>
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="email@exemplo.com" required />
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Usuário *</Label>
                    <Input value={formData.usuario} onChange={(e) => setFormData({ ...formData, usuario: e.target.value })} placeholder="nome.usuario" required />
                    {errors.usuario && <p className="text-sm text-destructive">{errors.usuario}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Senha *</Label>
                    <Input type="password" value={formData.senha} onChange={(e) => setFormData({ ...formData, senha: e.target.value })} placeholder="••••••••" required />
                    {errors.senha && <p className="text-sm text-destructive">{errors.senha}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Funções</Label>
                    <div className="border rounded-lg">
                      <div className="p-2 border-b">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input placeholder="Buscar função..." value={roleSearch} onChange={(e) => setRoleSearch(e.target.value)} className="pl-10 border-0 focus-visible:ring-0" />
                        </div>
                      </div>
                      <ScrollArea className="max-h-[200px]">
                        <div className="p-1">
                          {filteredRolesForForm.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma função cadastrada</p>
                          ) : filteredRolesForForm.map((role) => (
                            <button
                              key={role.id}
                              type="button"
                              className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/50 transition-colors text-left"
                              onClick={() => setFormData(prev => ({
                                ...prev,
                                selectedRoleIds: prev.selectedRoleIds.includes(role.id)
                                  ? prev.selectedRoleIds.filter(id => id !== role.id)
                                  : [...prev.selectedRoleIds, role.id],
                              }))}
                            >
                              <div className={`h-4 w-4 shrink-0 rounded-sm border flex items-center justify-center transition-colors ${formData.selectedRoleIds.includes(role.id) ? 'bg-primary text-primary-foreground border-primary' : 'border-input bg-background'}`}>
                                {formData.selectedRoleIds.includes(role.id) && <Check className="h-3 w-3" />}
                              </div>
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: role.cor }} />
                              <span className="text-sm">{role.nome}</span>
                            </button>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>Cancelar</Button>
                <Button type="submit" variant="hero" disabled={isSubmitting || !formData.selectedId}>
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar Usuário'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Roles Dialog - same search format */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => { setIsEditDialogOpen(open); if (!open) { setEditingUser(null); setRoleSearch(''); } }}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="font-display">Editar Funções</DialogTitle>
            <DialogDescription>{editingUser?.nome} — Selecione as funções do usuário</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="border rounded-lg">
              <div className="p-2 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Buscar função..." value={roleSearch} onChange={(e) => setRoleSearch(e.target.value)} className="pl-10 border-0 focus-visible:ring-0" />
                </div>
              </div>
              <ScrollArea className="max-h-[300px]">
                <div className="p-1">
                  {filteredRolesForEdit.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhuma função cadastrada</p>
                  ) : filteredRolesForEdit.map((role) => (
                    <button
                      key={role.id}
                      type="button"
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-muted/50 transition-colors text-left"
                      onClick={() => setEditRoleIds(prev => prev.includes(role.id) ? prev.filter(id => id !== role.id) : [...prev, role.id])}
                    >
                      <div className={`h-4 w-4 shrink-0 rounded-sm border flex items-center justify-center transition-colors ${editRoleIds.includes(role.id) ? 'bg-primary text-primary-foreground border-primary' : 'border-input bg-background'}`}>
                        {editRoleIds.includes(role.id) && <Check className="h-3 w-3" />}
                      </div>
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: role.cor }} />
                      <span className="text-sm">{role.nome}</span>
                      {role.descricao && <span className="text-xs text-muted-foreground ml-auto truncate max-w-[120px]">{role.descricao}</span>}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t mt-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
            <Button variant="hero" onClick={handleSaveEdit} disabled={isSavingEdit}>
              {isSavingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Filters */}
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar por nome ou email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por função" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as funções</SelectItem>
                <SelectItem value="sem_funcao">Sem função</SelectItem>
                {customRoles.map(role => (<SelectItem key={role.id} value={role.nome}>{role.nome}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users List (Table format) */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <UserCog className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold text-foreground">Nenhum usuário encontrado</h3>
            <p className="text-sm text-muted-foreground mt-1">{searchTerm ? 'Tente ajustar a busca' : 'Comece criando o primeiro usuário'}</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="glass-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Funções</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">{getInitials(user.nome)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{user.nome}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>{getRoleBadges(user)}</TableCell>
                  <TableCell>
                    <Badge variant={user.status === 'ATIVO' ? 'default' : 'secondary'} className={user.status === 'ATIVO' ? 'bg-success/10 text-success' : ''}>
                      {user.status === 'ATIVO' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelectedUser(user); setIsSheetOpen(true); }}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(user)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Detail Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedUser && (
            <>
              <SheetHeader>
                <SheetTitle className="font-display">Detalhes do Usuário</SheetTitle>
                <SheetDescription>Informações do usuário selecionado</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">{getInitials(selectedUser.nome)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold">{selectedUser.nome}</h3>
                    {getRoleBadges(selectedUser)}
                  </div>
                </div>
                <div className="space-y-4">
                  <div><Label className="text-muted-foreground">Email</Label><p>{selectedUser.email}</p></div>
                  <div><Label className="text-muted-foreground">Status</Label><p>{selectedUser.status === 'ATIVO' ? 'Ativo' : 'Inativo'}</p></div>
                  <div><Label className="text-muted-foreground">Último Acesso</Label><p>{selectedUser.ultimo_acesso ? new Date(selectedUser.ultimo_acesso).toLocaleString('pt-BR') : 'Nunca acessou'}</p></div>
                  <div><Label className="text-muted-foreground">Cadastrado em</Label><p>{new Date(selectedUser.created_at).toLocaleDateString('pt-BR')}</p></div>
                </div>
                <Button variant="outline" className="w-full" onClick={() => { setIsSheetOpen(false); openEditDialog(selectedUser); }}>
                  <Edit className="w-4 h-4 mr-2" />Editar Funções
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
