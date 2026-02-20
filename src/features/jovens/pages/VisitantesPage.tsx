import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Loader2,
  MoreHorizontal,
  Trash2,
  Edit,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatPhoneNumber } from '@/lib/formatters';

interface JovemVisitante {
  id: string;
  nome: string;
  telefone: string | null;
  idade: number | null;
  email: string | null;
  faz_parte_viva_jovem: boolean;
  observacao: string | null;
  evento_origem_id: string | null;
  created_at: string;
  eventos?: { titulo: string } | null;
}

export default function JovensVisitantes() {
  const [visitantes, setVisitantes] = useState<JovemVisitante[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingVisitante, setEditingVisitante] = useState<JovemVisitante | null>(null);

  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    idade: '',
    email: '',
    faz_parte_viva_jovem: false,
    observacao: '',
  });

  useEffect(() => {
    fetchVisitantes();
  }, []);

  async function fetchVisitantes() {
    try {
      const { data, error } = await supabase
        .from('jovens_visitantes')
        .select('*, eventos(titulo)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVisitantes(data || []);
    } catch (error) {
      console.error('Error fetching visitantes:', error);
      toast.error('Erro ao carregar visitantes');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        nome: formData.nome,
        telefone: formData.telefone || null,
        idade: formData.idade ? parseInt(formData.idade) : null,
        email: formData.email || null,
        faz_parte_viva_jovem: formData.faz_parte_viva_jovem,
        observacao: formData.observacao || null,
      };

      if (editingVisitante) {
        const { error } = await supabase
          .from('jovens_visitantes')
          .update(payload)
          .eq('id', editingVisitante.id);
        if (error) throw error;
        toast.success('Visitante atualizado com sucesso!');
      } else {
        const { error } = await supabase.from('jovens_visitantes').insert([payload]);
        if (error) throw error;
        toast.success('Visitante cadastrado com sucesso!');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchVisitantes();
    } catch (error) {
      console.error('Error saving visitante:', error);
      toast.error('Erro ao salvar visitante');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este visitante?')) return;

    try {
      const { error } = await supabase.from('jovens_visitantes').delete().eq('id', id);
      if (error) throw error;
      toast.success('Visitante excluído com sucesso');
      fetchVisitantes();
    } catch (error) {
      console.error('Error deleting visitante:', error);
      toast.error('Erro ao excluir visitante');
    }
  }

  function resetForm() {
    setFormData({
      nome: '',
      telefone: '',
      idade: '',
      email: '',
      faz_parte_viva_jovem: false,
      observacao: '',
    });
    setEditingVisitante(null);
  }

  function openEditDialog(visitante: JovemVisitante) {
    setEditingVisitante(visitante);
    setFormData({
      nome: visitante.nome,
      telefone: visitante.telefone || '',
      idade: visitante.idade?.toString() || '',
      email: visitante.email || '',
      faz_parte_viva_jovem: visitante.faz_parte_viva_jovem,
      observacao: visitante.observacao || '',
    });
    setIsDialogOpen(true);
  }

  const filteredVisitantes = visitantes.filter((v) =>
    v.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Jovens Visitantes</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os jovens que visitam a igreja
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button variant="hero">
              <Plus className="w-4 h-4" />
              Novo Visitante
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="font-display">
                {editingVisitante ? 'Editar Visitante' : 'Cadastrar Visitante'}
              </DialogTitle>
              <DialogDescription>
                Preencha os dados do jovem visitante
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome completo *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome do visitante"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: formatPhoneNumber(e.target.value) })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="idade">Idade</Label>
                  <Input
                    id="idade"
                    type="number"
                    value={formData.idade}
                    onChange={(e) => setFormData({ ...formData, idade: e.target.value })}
                    placeholder="Ex: 18"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Faz parte do Viva Jovem?</Label>
                <Select
                  value={formData.faz_parte_viva_jovem ? 'sim' : 'nao'}
                  onValueChange={(value) => setFormData({ ...formData, faz_parte_viva_jovem: value === 'sim' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nao">Não</SelectItem>
                    <SelectItem value="sim">Sim</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="observacao">Observação</Label>
                <Textarea
                  id="observacao"
                  value={formData.observacao}
                  onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
                  placeholder="Alguma observação sobre o visitante..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="hero" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : editingVisitante ? (
                    'Atualizar'
                  ) : (
                    'Cadastrar'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredVisitantes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <UserPlus className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold text-foreground">Nenhum visitante encontrado</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {searchTerm ? 'Tente ajustar a busca' : 'Comece cadastrando o primeiro visitante'}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden md:table-cell">Telefone</TableHead>
                <TableHead className="hidden sm:table-cell">Idade</TableHead>
                <TableHead>Viva Jovem</TableHead>
                <TableHead className="hidden lg:table-cell">Evento Origem</TableHead>
                <TableHead className="hidden md:table-cell">Data Cadastro</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVisitantes.map((visitante, index) => (
                <TableRow
                  key={visitante.id}
                  className="animate-fade-in opacity-0"
                  style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'forwards' }}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{visitante.nome}</p>
                        {visitante.email && (
                          <p className="text-xs text-muted-foreground">{visitante.email}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {visitante.telefone || '-'}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {visitante.idade ? `${visitante.idade} anos` : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={visitante.faz_parte_viva_jovem ? 'default' : 'secondary'}>
                      {visitante.faz_parte_viva_jovem ? 'Sim' : 'Não'}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {visitante.eventos?.titulo || '-'}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {formatDate(visitante.created_at)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(visitante)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(visitante.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
