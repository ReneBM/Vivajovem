import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  User,
  Phone,
  Calendar,
  Droplets,
  Users,
  Loader2,
  Edit,
  Save,
  X,
  Church,
  CheckCircle,
  XCircle,
  Heart,
  ArrowLeft,
} from 'lucide-react';
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
  redes_sociais?: Record<string, string> | null;
  grupos?: { nome: string } | null;
}

interface Grupo {
  id: string;
  nome: string;
}

interface FichaCadastralProps {
  jovem: Jovem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

const statusRelacionamentoLabels: Record<string, string> = {
  SOLTEIRO: 'Solteiro(a)',
  ORANDO: 'Orando',
  NAMORANDO: 'Namorando',
  NOIVADO: 'Noivo(a)',
  CASADO: 'Casado(a)',
};

export function FichaCadastral({ jovem, open, onOpenChange, onUpdate }: FichaCadastralProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    telefone: '',
    data_nascimento: '',
    batizado: false,
    titulo_eclesiastico: 'MEMBRO',
    status: 'ATIVO',
    grupo_id: '',
    foto_url: null as string | null,
    status_relacionamento: 'SOLTEIRO',
  });

  useEffect(() => {
    if (jovem) {
      setFormData({
        nome: jovem.nome,
        cpf: jovem.cpf || '',
        telefone: jovem.telefone || '',
        data_nascimento: jovem.data_nascimento || '',
        batizado: jovem.batizado,
        titulo_eclesiastico: jovem.titulo_eclesiastico,
        status: jovem.status,
        grupo_id: jovem.grupo_id || '',
        foto_url: jovem.foto_url,
        status_relacionamento: jovem.status_relacionamento || 'SOLTEIRO',
      });
      setIsEditing(false);
    }
  }, [jovem]);

  useEffect(() => {
    fetchGrupos();
  }, []);

  async function fetchGrupos() {
    try {
      const { data, error } = await supabase
        .from('grupos')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setGrupos(data || []);
    } catch (error) {
      console.error('Error fetching grupos:', error);
    }
  }

  async function handleSave() {
    if (!jovem) return;
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('jovens')
        .update({
          nome: formData.nome,
          cpf: formData.cpf || null,
          telefone: formData.telefone || null,
          data_nascimento: formData.data_nascimento || null,
          batizado: formData.batizado,
          titulo_eclesiastico: formData.titulo_eclesiastico as "MEMBRO" | "OBREIRO" | "DIACONO" | "PRESBITERO" | "EVANGELISTA" | "PASTOR",
          status: formData.status as "ATIVO" | "INATIVO",
          grupo_id: formData.grupo_id || null,
          foto_url: formData.foto_url,
          status_relacionamento: formData.status_relacionamento,
        })
        .eq('id', jovem.id);

      if (error) throw error;

      toast.success('Dados atualizados com sucesso!');
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating jovem:', error);
      toast.error('Erro ao atualizar dados');
    } finally {
      setIsSubmitting(false);
    }
  }

  function getInitials(name: string) {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

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

  function formatDate(dateStr: string) {
    // Parse date string directly to avoid timezone issues
    const [year, month, day] = dateStr.split('-').map(Number);
    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
  }

  if (!jovem) return null;

  const grupoNome = grupos.find(g => g.id === formData.grupo_id)?.nome || jovem.grupos?.nome;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto [&>button]:hidden">
        <SheetHeader className="text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SheetClose asChild>
                <Button variant="ghost" size="icon" className="-ml-2 text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </Button>
              </SheetClose>
              <SheetTitle className="font-display text-xl">Ficha Cadastral</SheetTitle>
            </div>

            {!isEditing ? (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => {
                  setIsEditing(false);
                  if (jovem) {
                    setFormData({
                      nome: jovem.nome,
                      cpf: jovem.cpf || '',
                      telefone: jovem.telefone || '',
                      data_nascimento: jovem.data_nascimento || '',
                      batizado: jovem.batizado,
                      titulo_eclesiastico: jovem.titulo_eclesiastico,
                      status: jovem.status,
                      grupo_id: jovem.grupo_id || '',
                      foto_url: jovem.foto_url,
                      status_relacionamento: jovem.status_relacionamento || 'SOLTEIRO',
                    });
                  }
                }}>
                  Cancelar
                </Button>
                <Button variant="hero" size="sm" onClick={handleSave} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Salvar
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </SheetHeader>

        <div className="mt-8 space-y-6">
          {/* Profile Header */}
          <div className="flex flex-col items-center text-center">
            {isEditing ? (
              <ImageUpload
                currentImage={formData.foto_url}
                onImageChange={(url) => setFormData({ ...formData, foto_url: url })}
                folder="jovens"
                initials={getInitials(formData.nome)}
                size="lg"
              />
            ) : (
              <Avatar className="h-24 w-24 ring-4 ring-primary/20">
                <AvatarImage src={formData.foto_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                  {getInitials(formData.nome)}
                </AvatarFallback>
              </Avatar>
            )}

            {isEditing ? (
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="mt-4 text-center text-xl font-semibold max-w-[280px]"
              />
            ) : (
              <h2 className="mt-4 text-xl font-semibold text-foreground">{formData.nome}</h2>
            )}

            <div className="flex items-center gap-2 mt-2 flex-wrap justify-center">
              <Badge
                variant={formData.status === 'ATIVO' ? 'default' : 'secondary'}
                className={formData.status === 'ATIVO' ? 'bg-success/10 text-success border-success/20' : ''}
              >
                {formData.status === 'ATIVO' ? (
                  <CheckCircle className="w-3 h-3 mr-1" />
                ) : (
                  <XCircle className="w-3 h-3 mr-1" />
                )}
                {formData.status}
              </Badge>
              {formData.batizado && (
                <Badge variant="outline" className="border-primary/50 text-primary">
                  <Droplets className="w-3 h-3 mr-1" />
                  Batizado
                </Badge>
              )}
              {formData.status_relacionamento && formData.status_relacionamento !== 'SOLTEIRO' && (
                <Badge variant="outline" className="border-pink-500/50 text-pink-500">
                  <Heart className="w-3 h-3 mr-1" />
                  {statusRelacionamentoLabels[formData.status_relacionamento]}
                </Badge>
              )}
            </div>
          </div>

          <Separator />

          {/* Info Cards */}
          <div className="space-y-4">
            {/* Dados Pessoais */}
            <div className="bg-muted/30 rounded-lg p-4 space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                Dados Pessoais
              </h3>

              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <User className="w-4 h-4" />
                    CPF
                  </span>
                  {isEditing ? (
                    <Input
                      value={formData.cpf}
                      onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                      className="max-w-[180px] text-right"
                      placeholder="000.000.000-00"
                      maxLength={14}
                    />
                  ) : (
                    <span className="text-sm font-medium">{formData.cpf || '-'}</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Telefone
                  </span>
                  {isEditing ? (
                    <Input
                      value={formData.telefone}
                      onChange={(e) => setFormData({ ...formData, telefone: formatPhoneNumber(e.target.value) })}
                      className="max-w-[180px] text-right"
                      placeholder="(00) 00000-0000"
                    />
                  ) : (
                    <span className="text-sm font-medium">{formData.telefone || '-'}</span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Nascimento
                  </span>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={formData.data_nascimento}
                      onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                      className="max-w-[180px]"
                    />
                  ) : (
                    <span className="text-sm font-medium">
                      {formData.data_nascimento
                        ? `${formatDate(formData.data_nascimento)} (${calculateAge(formData.data_nascimento)} anos)`
                        : '-'}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Heart className="w-4 h-4" />
                    Relacionamento
                  </span>
                  {isEditing ? (
                    <Select
                      value={formData.status_relacionamento}
                      onValueChange={(value) => setFormData({ ...formData, status_relacionamento: value })}
                    >
                      <SelectTrigger className="max-w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SOLTEIRO">Solteiro(a)</SelectItem>
                        <SelectItem value="ORANDO">Orando</SelectItem>
                        <SelectItem value="NAMORANDO">Namorando</SelectItem>
                        <SelectItem value="NOIVADO">Noivo(a)</SelectItem>
                        <SelectItem value="CASADO">Casado(a)</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-sm font-medium">
                      {statusRelacionamentoLabels[formData.status_relacionamento] || 'Solteiro(a)'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Dados Eclesiásticos */}
            <div className="bg-muted/30 rounded-lg p-4 space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Church className="w-4 h-4 text-primary" />
                Dados Eclesiásticos
              </h3>

              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Título</span>
                  {isEditing ? (
                    <Select
                      value={formData.titulo_eclesiastico}
                      onValueChange={(value) => setFormData({ ...formData, titulo_eclesiastico: value })}
                    >
                      <SelectTrigger className="max-w-[180px]">
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
                  ) : (
                    <span className="text-sm font-medium capitalize">
                      {formData.titulo_eclesiastico.toLowerCase()}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Droplets className="w-4 h-4" />
                    Batizado
                  </span>
                  {isEditing ? (
                    <Select
                      value={formData.batizado ? 'sim' : 'nao'}
                      onValueChange={(value) => setFormData({ ...formData, batizado: value === 'sim' })}
                    >
                      <SelectTrigger className="max-w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sim">Sim</SelectItem>
                        <SelectItem value="nao">Não</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-sm font-medium">{formData.batizado ? 'Sim' : 'Não'}</span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  {isEditing ? (
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger className="max-w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ATIVO">Ativo</SelectItem>
                        <SelectItem value="INATIVO">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-sm font-medium">{formData.status}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Grupo */}
            <div className="bg-muted/30 rounded-lg p-4 space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Grupo
              </h3>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Grupo do jovem</span>
                {isEditing ? (
                  <Select
                    value={formData.grupo_id || 'none'}
                    onValueChange={(value) => setFormData({ ...formData, grupo_id: value === 'none' ? '' : value })}
                  >
                    <SelectTrigger className="max-w-[180px]">
                      <SelectValue placeholder="Selecionar grupo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {grupos.map((grupo) => (
                        <SelectItem key={grupo.id} value={grupo.id}>
                          {grupo.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="text-sm font-medium">{grupoNome || 'Nenhum'}</span>
                )}
              </div>

              {grupos.length === 0 && isEditing && (
                <p className="text-xs text-muted-foreground">
                  Nenhum grupo cadastrado. Cadastre grupos primeiro na aba Diretoria.
                </p>
              )}
            </div>
          </div>

          {/* Footer Info */}
          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              Cadastrado em {formatDate(jovem.created_at)}
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
