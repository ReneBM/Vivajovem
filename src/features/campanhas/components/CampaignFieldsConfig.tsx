import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, GripVertical, User, Phone, Mail, Calendar, Heart, MapPin, Instagram, Church, AlertTriangle } from 'lucide-react';
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

export interface FieldConfig {
  id: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'date' | 'select' | 'checkbox';
  required: boolean;
  enabled: boolean;
  placeholder?: string;
  options?: string[];
  icon?: string;
}

export const DEFAULT_FIELDS: FieldConfig[] = [
  { id: 'nome', label: 'Nome completo', type: 'text', required: true, enabled: true, placeholder: 'Digite seu nome completo', icon: 'user' },
  { id: 'telefone', label: 'Telefone (WhatsApp)', type: 'tel', required: false, enabled: true, placeholder: '(00) 00000-0000', icon: 'phone' },
  { id: 'email', label: 'E-mail', type: 'email', required: false, enabled: true, placeholder: 'seu@email.com', icon: 'mail' },
  { id: 'data_nascimento', label: 'Data de nascimento', type: 'date', required: false, enabled: true, icon: 'calendar' },
  { id: 'batizado', label: 'É batizado(a)?', type: 'select', required: false, enabled: true, options: ['Não', 'Sim'], icon: 'church' },
  { id: 'instagram', label: 'Instagram', type: 'text', required: false, enabled: false, placeholder: '@seu_usuario', icon: 'instagram' },
  { id: 'cidade', label: 'Cidade', type: 'text', required: false, enabled: false, placeholder: 'Sua cidade', icon: 'mappin' },
  { id: 'como_conheceu', label: 'Como conheceu o VIVA?', type: 'text', required: false, enabled: false, placeholder: 'Amigos, redes sociais...', icon: 'heart' },
];

const ICON_MAP: Record<string, React.ReactNode> = {
  user: <User className="w-4 h-4" />,
  phone: <Phone className="w-4 h-4" />,
  mail: <Mail className="w-4 h-4" />,
  calendar: <Calendar className="w-4 h-4" />,
  church: <Church className="w-4 h-4" />,
  instagram: <Instagram className="w-4 h-4" />,
  mappin: <MapPin className="w-4 h-4" />,
  heart: <Heart className="w-4 h-4" />,
};

interface CampaignFieldsConfigProps {
  fields: FieldConfig[];
  onChange: (fields: FieldConfig[]) => void;
}

export function CampaignFieldsConfig({ fields, onChange }: CampaignFieldsConfigProps) {
  const [customFieldLabel, setCustomFieldLabel] = useState('');
  const [fieldToDelete, setFieldToDelete] = useState<FieldConfig | null>(null);

  const toggleField = (fieldId: string) => {
    const updated = fields.map(f => 
      f.id === fieldId ? { ...f, enabled: !f.enabled } : f
    );
    onChange(updated);
  };

  const toggleRequired = (fieldId: string) => {
    const updated = fields.map(f => 
      f.id === fieldId ? { ...f, required: !f.required } : f
    );
    onChange(updated);
  };

  const addCustomField = () => {
    if (!customFieldLabel.trim()) return;
    
    const newField: FieldConfig = {
      id: `custom_${Date.now()}`,
      label: customFieldLabel,
      type: 'text',
      required: false,
      enabled: true,
      placeholder: `Digite ${customFieldLabel.toLowerCase()}`,
      icon: 'heart',
    };
    
    onChange([...fields, newField]);
    setCustomFieldLabel('');
  };

  const confirmDeleteField = () => {
    if (fieldToDelete) {
      onChange(fields.filter(f => f.id !== fieldToDelete.id));
      setFieldToDelete(null);
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <GripVertical className="w-5 h-5 text-primary" />
          Campos do Formulário
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Selecione quais campos aparecerão no formulário de inscrição
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.map((field) => (
          <div
            key={field.id}
            className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
              field.enabled 
                ? 'bg-primary/5 border-primary/20' 
                : 'bg-muted/30 border-border/50 opacity-60'
            }`}
          >
            <div className="flex items-center gap-3">
              <Checkbox
                id={`field-${field.id}`}
                checked={field.enabled}
                onCheckedChange={() => toggleField(field.id)}
                disabled={field.id === 'nome'}
              />
              <div className="flex items-center gap-2 text-muted-foreground">
                {ICON_MAP[field.icon || 'heart']}
              </div>
              <Label 
                htmlFor={`field-${field.id}`} 
                className={`cursor-pointer ${field.enabled ? 'text-foreground' : 'text-muted-foreground'}`}
              >
                {field.label}
              </Label>
              {field.id === 'nome' && (
                <span className="text-xs text-muted-foreground">(obrigatório)</span>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              {field.enabled && field.id !== 'nome' && (
                <div className="flex items-center gap-2">
                  <Label htmlFor={`required-${field.id}`} className="text-xs text-muted-foreground">
                    Obrigatório
                  </Label>
                  <Switch
                    id={`required-${field.id}`}
                    checked={field.required}
                    onCheckedChange={() => toggleRequired(field.id)}
                  />
                </div>
              )}
              {field.id.startsWith('custom_') && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setFieldToDelete(field)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        ))}

        {/* Add custom field */}
        <div className="flex gap-2 pt-4 border-t border-border/50">
          <Input
            placeholder="Adicionar campo personalizado..."
            value={customFieldLabel}
            onChange={(e) => setCustomFieldLabel(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addCustomField()}
          />
          <Button
            type="button"
            variant="outline"
            onClick={addCustomField}
            disabled={!customFieldLabel.trim()}
          >
            <Plus className="w-4 h-4" />
            Adicionar
          </Button>
        </div>
      </CardContent>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={!!fieldToDelete} onOpenChange={(open) => !open && setFieldToDelete(null)}>
        <AlertDialogContent className="border-destructive/20 bg-card">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <AlertDialogTitle className="text-xl">Excluir Campo</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-muted-foreground">
              Tem certeza que deseja excluir o campo <span className="font-semibold text-foreground">"{fieldToDelete?.label}"</span>?
              <br />
              <span className="text-destructive/80 text-sm mt-2 block">
                Esta ação não pode ser desfeita.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="border-border">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteField}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir Campo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
