import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Phone,
  Mail,
  UserCheck,
  Loader2,
  MoreHorizontal,
  Trash2,
  Eye,
  Award,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ImageUpload } from '@/components/shared/ImageUpload';
import { FichaLider } from '@/components/diretoria/FichaLider';
import { formatPhoneNumber } from '@/lib/formatters';

interface Lider {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  status: string;
  foto_url: string | null;
  titulo_eclesiastico: string | null;
  created_at: string;
}

export default function LideresTab() {
  const [lideres, setLideres] = useState<Lider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedLider, setSelectedLider] = useState<Lider | null>(null);
  const [isFichaOpen, setIsFichaOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    foto_url: null as string | null,
    titulo_eclesiastico: 'MEMBRO',
  });

  useEffect(() => {
    fetchLideres();
  }, []);

  async function fetchLideres() {
    try {
      const { data, error } = await supabase
        .from('lideres')
        .select('*')
        .order('nome');

      if (error) throw error;
      setLideres(data || []);
    } catch (error) {
      console.error('Error fetching lideres:', error);
      toast.error('Erro ao carregar líderes');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('lideres').insert([{
        nome: formData.nome,
        telefone: formData.telefone || null,
        email: formData.email || null,
        foto_url: formData.foto_url,
        titulo_eclesiastico: formData.titulo_eclesiastico as 'MEMBRO' | 'OBREIRO' | 'DIACONO' | 'PRESBITERO' | 'EVANGELISTA' | 'PASTOR',
      }]);

      if (error) throw error;

      toast.success('Líder cadastrado com sucesso!');
      setIsDialogOpen(false);
      setFormData({ nome: '', telefone: '', email: '', foto_url: null, titulo_eclesiastico: 'MEMBRO' });
      fetchLideres();
    } catch (error) {
      console.error('Error creating lider:', error);
      toast.error('Erro ao cadastrar líder');
    } finally {
      setIsSubmitting(false);
    }
  }

  const getTituloLabel = (titulo: string | null) => {
    const titulos: Record<string, string> = {
      MEMBRO: 'Membro',
      OBREIRO: 'Obreiro',
      DIACONO: 'Diácono',
      PRESBITERO: 'Presbítero',
      EVANGELISTA: 'Evangelista',
      PASTOR: 'Pastor',
    };
    return titulos[titulo || 'MEMBRO'] || 'Membro';
  };

  async function handleDelete() {
    if (!deleteId) return;

    try {
      const { error } = await supabase.from('lideres').delete().eq('id', deleteId);
      if (error) throw error;

      toast.success('Líder excluído com sucesso');
      fetchLideres();
    } catch (error) {
      console.error('Error deleting lider:', error);
      toast.error('Erro ao excluir líder');
    } finally {
      setDeleteId(null);
    }
  }

  const filteredLideres = lideres.filter((lider) =>
    lider.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  function getInitials(name: string) {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="hero">
              <Plus className="w-4 h-4" />
              Novo Líder
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="font-display">Cadastrar Líder</DialogTitle>
              <DialogDescription>
                Preencha os dados do novo líder
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="flex justify-center">
                <ImageUpload
                  currentImage={formData.foto_url}
                  onImageChange={(url) => setFormData({ ...formData, foto_url: url })}
                  folder="lideres"
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
                  placeholder="Nome do líder"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: formatPhoneNumber(e.target.value) })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Título eclesiástico</Label>
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

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredLideres.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <UserCheck className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold text-foreground">Nenhum líder encontrado</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {searchTerm
                ? 'Tente ajustar a busca'
                : 'Comece cadastrando o primeiro líder'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLideres.map((lider, index) => (
            <Card
              key={lider.id}
              className="glass-card animate-slide-up opacity-0 hover:shadow-lg transition-shadow"
              style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={lider.foto_url || undefined} />
                      <AvatarFallback className="bg-success/10 text-success text-lg font-semibold">
                        {getInitials(lider.nome)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-foreground">{lider.nome}</h3>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        <Badge
                          variant={lider.status === 'ATIVO' ? 'default' : 'secondary'}
                          className={lider.status === 'ATIVO' ? 'bg-success/10 text-success hover:bg-success/20' : ''}
                        >
                          {lider.status === 'ATIVO' ? 'Ativo' : 'Inativo'}
                        </Badge>
                        <Badge variant="outline" className="border-primary/50 text-primary">
                          <Award className="w-3 h-3 mr-1" />
                          {getTituloLabel(lider.titulo_eclesiastico)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        setSelectedLider(lider);
                        setIsFichaOpen(true);
                      }}>
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Ficha
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setDeleteId(lider.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="mt-4 space-y-2">
                  {lider.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      <span>{lider.email}</span>
                    </div>
                  )}
                  {lider.telefone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span>{lider.telefone}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Líder</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este líder? Esta ação não pode ser desfeita.
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

      {/* Ficha do Líder Sheet */}
      <FichaLider
        lider={selectedLider}
        open={isFichaOpen}
        onOpenChange={setIsFichaOpen}
        onUpdate={fetchLideres}
      />
    </div>
  );
}
