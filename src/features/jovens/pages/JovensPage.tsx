import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Search,
  Filter,
  MoreHorizontal,
  Droplets,
  Users,
  Loader2,
  Trash2,
  Eye,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FichaCadastral } from '@/features/jovens/components/FichaCadastral';
import { ImageUpload } from '@/components/shared/ImageUpload';
import { formatPhoneNumber, formatCPF } from '@/lib/formatters';

interface Jovem {
  id: string;
  nome: string;
  cpf?: string | null;
  foto_url: string | null;
  data_nascimento: string | null;
  telefone: string | null;
  titulo_eclesiastico: string;
  batizado: boolean;
  status: string;
  grupo_id: string | null;
  created_at: string;
  status_relacionamento?: string | null;
  grupos?: { nome: string } | null;
}

export default function Jovens() {
  const [jovens, setJovens] = useState<Jovem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterBatizado, setFilterBatizado] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedJovem, setSelectedJovem] = useState<Jovem | null>(null);
  const [isFichaOpen, setIsFichaOpen] = useState(false);
  const [jovemToDelete, setJovemToDelete] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    telefone: '',
    data_nascimento: '',
    batizado: false,
    titulo_eclesiastico: 'MEMBRO',
    foto_url: null as string | null,
    status_relacionamento: 'SOLTEIRO',
  });

  function getInitials(name: string) {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  useEffect(() => {
    fetchJovens();
  }, []);

  async function fetchJovens() {
    try {
      const { data, error } = await supabase
        .from('jovens')
        .select('*, grupos(nome)')
        .order('nome');

      if (error) throw error;
      setJovens(data || []);
    } catch (error) {
      console.error('Error fetching jovens:', error);
      toast.error('Erro ao carregar jovens');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Fix timezone issue by appending T12:00:00 to avoid UTC conversion issues
      const dataNascimento = formData.data_nascimento
        ? formData.data_nascimento
        : null;

      const { error } = await supabase.from('jovens').insert([{
        nome: formData.nome,
        cpf: formData.cpf || null,
        telefone: formData.telefone || null,
        data_nascimento: dataNascimento,
        batizado: formData.batizado,
        titulo_eclesiastico: formData.titulo_eclesiastico as "MEMBRO" | "OBREIRO" | "DIACONO" | "PRESBITERO" | "EVANGELISTA" | "PASTOR",
        foto_url: formData.foto_url,
        status_relacionamento: formData.status_relacionamento,
      }]);

      if (error) throw error;

      toast.success('Jovem cadastrado com sucesso!');
      setIsDialogOpen(false);
      toast.success('Jovem cadastrado com sucesso!');
      setIsDialogOpen(false);
      setFormData({
        nome: '',
        cpf: '',
        telefone: '',
        data_nascimento: '',
        batizado: false,
        titulo_eclesiastico: 'MEMBRO',
        foto_url: null,
        status_relacionamento: 'SOLTEIRO',
      });
      fetchJovens();
    } catch (error) {
      console.error('Error creating jovem:', error);
      toast.error('Erro ao cadastrar jovem');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setJovemToDelete(id);
  }

  async function confirmDelete() {
    if (!jovemToDelete) return;

    try {
      const { error } = await supabase.from('jovens').delete().eq('id', jovemToDelete);
      if (error) throw error;

      toast.success('Jovem excluído com sucesso');
      fetchJovens();
    } catch (error) {
      console.error('Error deleting jovem:', error);
      toast.error('Erro ao excluir jovem');
    } finally {
      setJovemToDelete(null);
    }
  }

  const filteredJovens = jovens.filter((jovem) => {
    const matchesSearch = jovem.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || jovem.status === filterStatus;
    const matchesBatizado =
      filterBatizado === 'all' ||
      (filterBatizado === 'sim' && jovem.batizado) ||
      (filterBatizado === 'nao' && !jovem.batizado);

    return matchesSearch && matchesStatus && matchesBatizado;
  });

  function calculateAge(birthDate: string) {
    const today = new Date();
    // Parse date string directly to avoid timezone issues
    const [year, month, day] = birthDate.split('-').map(Number);
    const birth = new Date(year, month - 1, day);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Jovens</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os jovens do ministério
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="hero">
              <Plus className="w-4 h-4" />
              Novo Jovem
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="font-display">Cadastrar Jovem</DialogTitle>
              <DialogDescription>
                Preencha os dados do novo jovem
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="flex justify-center">
                <ImageUpload
                  currentImage={formData.foto_url}
                  onImageChange={(url) => setFormData({ ...formData, foto_url: url })}
                  folder="jovens"
                  initials={formData.nome ? getInitials(formData.nome) : '?'}
                  size="md"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nome">Nome completo *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome do jovem"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                  placeholder="000.000.000-00"
                  maxLength={14}
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
                  <Label htmlFor="data_nascimento">Data de nascimento</Label>
                  <Input
                    id="data_nascimento"
                    type="date"
                    value={formData.data_nascimento}
                    onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="titulo">Título eclesiástico</Label>
                  <Select
                    value={formData.titulo_eclesiastico}
                    onValueChange={(value) => setFormData({ ...formData, titulo_eclesiastico: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MEMBRO">Membro</SelectItem>
                      <SelectItem value="OBREIRO">Obreiro</SelectItem>
                      <SelectItem value="DIACONO">Diácono</SelectItem>
                      <SelectItem value="PRESBITERO">Presbítero</SelectItem>
                      <SelectItem value="EVANGELISTA">Evangelista</SelectItem>
                      <SelectItem value="PASTOR">Pastor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Batizado</Label>
                  <Select
                    value={formData.batizado ? 'sim' : 'nao'}
                    onValueChange={(value) => setFormData({ ...formData, batizado: value === 'sim' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sim">Sim</SelectItem>
                      <SelectItem value="nao">Não</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Status de relacionamento</Label>
                <Select
                  value={formData.status_relacionamento}
                  onValueChange={(value) => setFormData({ ...formData, status_relacionamento: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SOLTEIRO">Solteiro(a)</SelectItem>
                    <SelectItem value="ORANDO">Orando</SelectItem>
                    <SelectItem value="NAMORANDO">Namorando</SelectItem>
                    <SelectItem value="NOIVO">Noivo(a)</SelectItem>
                    <SelectItem value="CASADO">Casado(a)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="hero" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Cadastrar'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-3">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="ATIVO">Ativos</SelectItem>
                  <SelectItem value="INATIVO">Inativos</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterBatizado} onValueChange={setFilterBatizado}>
                <SelectTrigger className="w-[140px]">
                  <Droplets className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Batismo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="sim">Batizados</SelectItem>
                  <SelectItem value="nao">Não batizados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredJovens.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold text-foreground">Nenhum jovem encontrado</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {searchTerm || filterStatus !== 'all' || filterBatizado !== 'all'
                ? 'Tente ajustar os filtros'
                : 'Comece cadastrando o primeiro jovem'}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden md:table-cell">Telefone</TableHead>
                <TableHead className="hidden lg:table-cell">Idade</TableHead>
                <TableHead className="hidden md:table-cell">Grupo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Batismo</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJovens.map((jovem, index) => (
                <TableRow
                  key={jovem.id}
                  className="animate-fade-in opacity-0"
                  style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'forwards' }}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={jovem.foto_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {getInitials(jovem.nome)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">{jovem.nome}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {jovem.titulo_eclesiastico.toLowerCase()}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {jovem.telefone || '-'}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {jovem.data_nascimento ? `${calculateAge(jovem.data_nascimento)} anos` : '-'}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {jovem.grupos?.nome || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={jovem.status === 'ATIVO' ? 'default' : 'secondary'}
                      className={jovem.status === 'ATIVO' ? 'bg-success/10 text-success hover:bg-success/20' : ''}
                    >
                      {jovem.status === 'ATIVO' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {jovem.batizado ? (
                      <Badge variant="outline" className="border-primary/50 text-primary">
                        <Droplets className="w-3 h-3 mr-1" />
                        Sim
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">Não</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setSelectedJovem(jovem);
                          setIsFichaOpen(true);
                        }}>
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Ficha
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(jovem.id)}
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

      {/* Ficha Cadastral Sheet */}
      <FichaCadastral
        jovem={selectedJovem}
        open={isFichaOpen}
        onOpenChange={setIsFichaOpen}
        onUpdate={fetchJovens}
      />

      <AlertDialog open={!!jovemToDelete} onOpenChange={(open) => !open && setJovemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Isso excluirá permanentemente o cadastro do jovem e removerá seus dados do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir Jovem
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
