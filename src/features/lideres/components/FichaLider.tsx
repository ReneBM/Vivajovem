import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ImageUpload } from '@/components/shared/ImageUpload';
import { toast } from 'sonner';
import { Edit, Save, X, Mail, Phone, Calendar, Award } from 'lucide-react';
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

interface FichaLiderProps {
  lider: Lider | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function FichaLider({ lider, open, onOpenChange, onUpdate }: FichaLiderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    status: 'ATIVO',
    foto_url: null as string | null,
    titulo_eclesiastico: 'MEMBRO',
  });

  useEffect(() => {
    if (lider) {
      setFormData({
        nome: lider.nome,
        telefone: lider.telefone || '',
        email: lider.email || '',
        status: lider.status,
        foto_url: lider.foto_url,
        titulo_eclesiastico: lider.titulo_eclesiastico || 'MEMBRO',
      });
    }
  }, [lider]);

  const handleSave = async () => {
    if (!lider) return;
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('lideres')
        .update({
          nome: formData.nome,
          telefone: formData.telefone || null,
          email: formData.email || null,
          status: formData.status as 'ATIVO' | 'INATIVO',
          foto_url: formData.foto_url,
          titulo_eclesiastico: formData.titulo_eclesiastico as 'MEMBRO' | 'OBREIRO' | 'DIACONO' | 'PRESBITERO' | 'EVANGELISTA' | 'PASTOR',
        })
        .eq('id', lider.id);

      if (error) throw error;

      toast.success('Líder atualizado com sucesso!');
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating lider:', error);
      toast.error('Erro ao atualizar líder');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const getTituloLabel = (titulo: string) => {
    const titulos: Record<string, string> = {
      MEMBRO: 'Membro',
      OBREIRO: 'Obreiro',
      DIACONO: 'Diácono',
      PRESBITERO: 'Presbítero',
      EVANGELISTA: 'Evangelista',
      PASTOR: 'Pastor',
    };
    return titulos[titulo] || titulo;
  };

  if (!lider) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="font-display">Ficha do Líder</SheetTitle>
            {isEditing ? (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditing(false)}
                  disabled={isSubmitting}
                >
                  <X className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="hero"
                  onClick={handleSave}
                  disabled={isSubmitting}
                >
                  <Save className="w-4 h-4 mr-1" />
                  Salvar
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                <Edit className="w-4 h-4 mr-1" />
                Editar
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Avatar e Nome */}
          <div className="flex flex-col items-center text-center space-y-4">
            <ImageUpload
              currentImage={formData.foto_url}
              onImageChange={(url) => setFormData({ ...formData, foto_url: url })}
              folder="lideres"
              initials={getInitials(formData.nome)}
              size="lg"
              disabled={!isEditing}
            />
            
            {isEditing ? (
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="text-center font-semibold text-lg"
              />
            ) : (
              <h2 className="text-xl font-semibold text-foreground">{formData.nome}</h2>
            )}
            
            <div className="flex gap-2">
              <Badge
                variant={formData.status === 'ATIVO' ? 'default' : 'secondary'}
                className={formData.status === 'ATIVO' ? 'bg-success/10 text-success' : ''}
              >
                {formData.status === 'ATIVO' ? 'Ativo' : 'Inativo'}
              </Badge>
              <Badge variant="outline" className="border-primary/50 text-primary">
                <Award className="w-3 h-3 mr-1" />
                {getTituloLabel(formData.titulo_eclesiastico)}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Dados Pessoais */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              Dados Pessoais
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                {isEditing ? (
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@exemplo.com"
                    className="flex-1"
                  />
                ) : (
                  <span className="text-foreground">{formData.email || 'Não informado'}</span>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-muted-foreground" />
                {isEditing ? (
                  <Input
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: formatPhoneNumber(e.target.value) })}
                    placeholder="(00) 00000-0000"
                    className="flex-1"
                  />
                ) : (
                  <span className="text-foreground">{formData.telefone || 'Não informado'}</span>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Dados Eclesiásticos */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Dados Eclesiásticos</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Título</Label>
                {isEditing ? (
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
                ) : (
                  <p className="text-foreground">{getTituloLabel(formData.titulo_eclesiastico)}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Status</Label>
                {isEditing ? (
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ATIVO">Ativo</SelectItem>
                      <SelectItem value="INATIVO">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-foreground">{formData.status === 'ATIVO' ? 'Ativo' : 'Inativo'}</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Data de Cadastro */}
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Cadastrado em {formatDate(lider.created_at)}</span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
