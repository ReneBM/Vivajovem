import { supabase } from '@/integrations/supabase/client';
import { WhatsAppInstance, WhatsAppMessage } from '../types/whatsapp.types';

export class WhatsAppRepository {
    /**
     * Lista todas as instâncias do usuário logado.
     */
    async getInstances() {
        const { data, error } = await supabase
            .from('whatsapp_instances' as any)
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as unknown as WhatsAppInstance[];
    }

    /**
     * Salva uma nova instância no banco.
     */
    async saveInstance(instance: Partial<WhatsAppInstance>) {
        const { data, error } = await supabase
            .from('whatsapp_instances' as any)
            .insert([instance])
            .select()
            .single();

        if (error) throw error;
        return data as unknown as WhatsAppInstance;
    }

    /**
     * Atualiza o status de uma instância.
     */
    async updateInstanceStatus(id: string, status: WhatsAppInstance['status'], qrcode?: string) {
        const { data, error } = await supabase
            .from('whatsapp_instances' as any)
            .update({ status, qrcode, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as unknown as WhatsAppInstance;
    }

    /**
     * Atualiza campos parciais de uma instância.
     */
    async updateInstance(id: string, fields: Partial<WhatsAppInstance>) {
        const { data, error } = await supabase
            .from('whatsapp_instances' as any)
            .update({ ...fields, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as unknown as WhatsAppInstance;
    }

    /**
     * Remove uma instância do banco.
     */
    async deleteInstance(id: string) {
        const { error } = await supabase
            .from('whatsapp_instances' as any)
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    /**
     * Salva uma mensagem no histórico.
     */
    async saveMessage(message: Partial<WhatsAppMessage>) {
        const { data, error } = await supabase
            .from('whatsapp_messages' as any)
            .insert([message])
            .select()
            .single();

        if (error) throw error;
        return data as unknown as WhatsAppMessage;
    }

    /**
     * Busca o histórico de mensagens de uma instância.
     */
    async getMessages(instanceId: string) {
        const { data, error } = await supabase
            .from('whatsapp_messages' as any)
            .select('*')
            .eq('instance_id', instanceId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as unknown as WhatsAppMessage[];
    }
}
