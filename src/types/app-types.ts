import { Database } from '@/integrations/supabase/types';

// Base Types from Supabase
export type EventoRow = Database['public']['Tables']['eventos']['Row'];
export type EventoRecorrenteRow = Database['public']['Tables']['eventos_recorrentes']['Row'];
export type InscricaoEventoRow = Database['public']['Tables']['inscricoes_evento']['Row'];
export type TipoEventoRow = Database['public']['Tables']['tipos_evento']['Row'];
export type GrupoRow = Database['public']['Tables']['grupos']['Row'];
export type CampanhaRow = Database['public']['Tables']['campanhas']['Row'];

// Shared Interfaces
export interface FieldConfig {
    id: string;
    label: string;
    type: string;
    required: boolean;
    enabled: boolean;
    placeholder?: string;
    options?: string[];
    icon?: string;
}

// Extended Types (with Relations or Parsed JSON)
export interface Evento extends EventoRow {
    grupos?: { nome: string } | null;
    campanhas?: { nome: string } | null;
}

export interface EventoRecorrente extends EventoRecorrenteRow { }

export interface TipoEvento extends TipoEventoRow { }

export interface InscricaoEvento extends Omit<InscricaoEventoRow, 'campos_personalizados'> {
    campos_personalizados: FieldConfig[];
}

export interface Grupo {
    id: string;
    nome: string;
}

export interface Campanha {
    id: string;
    nome: string;
}

export type RespostaRow = Database['public']['Tables']['inscricoes_evento_respostas']['Row'];
export interface RespostaInscricao extends Omit<RespostaRow, 'dados'> {
    dados: Record<string, string>;
}

export const DEFAULT_FIELD_CONFIG: FieldConfig[] = [
    { id: 'nome', label: 'Nome completo', type: 'text', required: true, enabled: true, placeholder: 'Digite seu nome completo', icon: 'user' },
    { id: 'telefone', label: 'Telefone (WhatsApp)', type: 'tel', required: false, enabled: true, placeholder: '(00) 00000-0000', icon: 'phone' },
    { id: 'email', label: 'E-mail', type: 'email', required: false, enabled: true, placeholder: 'seu@email.com', icon: 'mail' },
    { id: 'data_nascimento', label: 'Data de nascimento', type: 'date', required: false, enabled: false, icon: 'calendar' },
    { id: 'batizado', label: 'É batizado(a)?', type: 'select', required: false, enabled: false, options: ['Não', 'Sim'], icon: 'church' },
    { id: 'instagram', label: 'Instagram', type: 'text', required: false, enabled: false, placeholder: '@seu_usuario', icon: 'instagram' },
    { id: 'cidade', label: 'Cidade', type: 'text', required: false, enabled: false, placeholder: 'Sua cidade', icon: 'mappin' },
    { id: 'como_conheceu', label: 'Como nos conheceu?', type: 'text', required: false, enabled: false, placeholder: 'Amigos, redes sociais...', icon: 'heart' },
];
