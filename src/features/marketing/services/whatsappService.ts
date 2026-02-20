import { supabase } from '@/integrations/supabase/client';

interface WhatsAppConfig {
    api_url: string;
    api_key: string;
    instance_name: string;
}

interface SendResult {
    success: boolean;
    error?: string;
}

/**
 * Busca a configuração da Evolution API no banco de dados.
 * Retorna null se não configurada.
 */
export async function getWhatsAppConfig(): Promise<WhatsAppConfig | null> {
    const { data, error } = await supabase
        .from('api_configurations')
        .select('configuracao, ativa')
        .eq('tipo', 'whatsapp')
        .single();

    if (error || !data || !data.ativa) return null;

    const config = data.configuracao as Record<string, string>;
    if (!config.api_url || !config.api_key || !config.instance_name) return null;

    return {
        api_url: config.api_url,
        api_key: config.api_key,
        instance_name: config.instance_name,
    };
}

/**
 * Formata o número de telefone para o padrão WhatsApp (55XXXXXXXXXXX).
 */
function formatPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    // Se já tem 13 dígitos (55 + DDD + número), retorna direto
    if (digits.length === 13) return digits;
    // Se tem 11 dígitos (DDD + número), adiciona 55
    if (digits.length === 11) return `55${digits}`;
    // Se tem 10 dígitos (DDD + número sem 9), adiciona 55
    if (digits.length === 10) return `55${digits}`;
    return digits;
}

/**
 * Envia uma mensagem de texto via Evolution API.
 */
export async function sendWhatsAppMessage(
    config: WhatsAppConfig,
    phone: string,
    message: string
): Promise<SendResult> {
    try {
        const formattedPhone = formatPhone(phone);
        const url = `${config.api_url}/message/sendText/${config.instance_name}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': config.api_key,
            },
            body: JSON.stringify({
                number: formattedPhone,
                text: message,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return { success: false, error: errorData.message || `HTTP ${response.status}` };
        }

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || 'Erro de conexão' };
    }
}

/**
 * Envia mensagem para múltiplos destinatários e atualiza o status no banco.
 */
export async function sendBulkMessages(
    mensagemId: string,
    phones: string[],
    message: string
): Promise<{ sent: number; failed: number }> {
    const config = await getWhatsAppConfig();

    if (!config) {
        // API não configurada — mantém como pendente
        return { sent: 0, failed: 0 };
    }

    // Atualizar status para "enviando"
    await supabase.from('whatsapp_mensagens').update({ status: 'enviando' }).eq('id', mensagemId);

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const phone of phones) {
        const result = await sendWhatsAppMessage(config, phone, message);
        if (result.success) {
            sent++;
        } else {
            failed++;
            errors.push(`${phone}: ${result.error}`);
        }
        // Pequeno delay entre envios para evitar rate limit
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Atualizar status final
    const finalStatus = failed === phones.length ? 'falha' : sent > 0 ? 'enviado' : 'falha';
    await supabase.from('whatsapp_mensagens').update({
        status: finalStatus,
        enviado_em: finalStatus === 'enviado' ? new Date().toISOString() : null,
        erro: errors.length > 0 ? errors.join('; ') : null,
    }).eq('id', mensagemId);

    return { sent, failed };
}
