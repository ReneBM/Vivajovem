/**
 * ╔══════════════════════════════════════════╗
 * ║   SCHEDULER - Agendamento de Mensagens  ║
 * ║   Roda em background junto com a API    ║
 * ╚══════════════════════════════════════════╝
 * 
 * Este script verifica a cada 30 segundos se há mensagens
 * agendadas pendentes e dispara o envio via Evolution API.
 * 
 * USO: node scheduler.js
 */

const { createClient } = require('@supabase/supabase-js');

// ── Configuração ──
const SUPABASE_URL = 'https://fcabefxzeqzlkoikzcaa.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Io3EqLppS2CroJDch5tCHA_hzM4VFFf';
const CHECK_INTERVAL = 30000; // 30 segundos

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Buscar config da Evolution API ──
async function getWhatsAppConfig() {
    const { data, error } = await supabase
        .from('api_configurations')
        .select('configuracao, ativa')
        .eq('tipo', 'whatsapp')
        .single();

    if (error || !data || !data.ativa) return null;

    const config = data.configuracao;
    if (!config.api_url || !config.api_key || !config.instance_name) return null;

    return {
        api_url: config.api_url,
        api_key: config.api_key,
        instance_name: config.instance_name,
    };
}

// ── Formatar telefone ──
function formatPhone(phone) {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 13) return digits;
    if (digits.length === 11) return `55${digits}`;
    if (digits.length === 10) return `55${digits}`;
    return digits;
}

// ── Enviar mensagem individual ──
async function sendMessage(config, phone, message) {
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
    } catch (error) {
        return { success: false, error: error.message || 'Erro de conexão' };
    }
}

// ── Processar uma mensagem agendada ──
async function processMessage(msg, config) {
    const phones = msg.destinatarios || [];
    let sent = 0;
    let failed = 0;
    const errors = [];

    // Atualizar status para "enviando"
    await supabase.from('whatsapp_mensagens')
        .update({ status: 'enviando' })
        .eq('id', msg.id);

    log(`  📤 Enviando para ${phones.length} destinatário(s)...`);

    for (const phone of phones) {
        if (!phone) continue;

        const result = await sendMessage(config, phone, msg.mensagem);
        if (result.success) {
            sent++;
        } else {
            failed++;
            errors.push(`${phone}: ${result.error}`);
        }

        // Delay entre mensagens (5 segundos padrão para agendamentos)
        await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // Atualizar status final
    const finalStatus = failed === phones.length ? 'falha' : sent > 0 ? 'enviado' : 'falha';
    await supabase.from('whatsapp_mensagens').update({
        status: finalStatus,
        enviado_em: finalStatus === 'enviado' ? new Date().toISOString() : null,
        erro: errors.length > 0 ? errors.join('; ') : null,
    }).eq('id', msg.id);

    log(`  ✅ ${sent} enviada(s), ❌ ${failed} falha(s)`);
    return { sent, failed };
}

// ── Verificar mensagens agendadas ──
async function checkScheduledMessages() {
    const now = new Date().toISOString();

    // Buscar mensagens agendadas pendentes que já passaram do horário
    const { data: messages, error } = await supabase
        .from('whatsapp_mensagens')
        .select('*')
        .eq('tipo', 'agendada')
        .eq('status', 'pendente')
        .lte('agendado_para', now);

    if (error) {
        log(`❌ Erro ao buscar agendamentos: ${error.message}`);
        return;
    }

    if (!messages || messages.length === 0) return;

    log(`\n🔔 ${messages.length} mensagem(ns) agendada(s) para processar!`);

    // Buscar configuração da Evolution API
    const config = await getWhatsAppConfig();
    if (!config) {
        log('⚠️  Evolution API não configurada. Mensagens ficarão pendentes.');
        return;
    }

    // Processar cada mensagem
    for (const msg of messages) {
        log(`\n📩 Processando mensagem ID: ${msg.id}`);
        log(`  📅 Agendada para: ${msg.agendado_para}`);
        log(`  👥 Destinatários: ${(msg.destinatarios || []).length}`);
        await processMessage(msg, config);
    }
}

// ── Logger com timestamp ──
function log(msg) {
    const time = new Date().toLocaleTimeString('pt-BR');
    console.log(`[${time}] ${msg}`);
}

// ── Iniciar ──
async function start() {
    console.log('');
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║  📅 Scheduler de Mensagens WhatsApp         ║');
    console.log('║  Verificando agendamentos a cada 30 seg     ║');
    console.log('╚══════════════════════════════════════════════╝');
    console.log('');

    // Verificar config na inicialização
    const config = await getWhatsAppConfig();
    if (config) {
        log(`✅ Evolution API configurada: ${config.api_url}`);
        log(`📱 Instância: ${config.instance_name}`);
    } else {
        log('⚠️  Evolution API não configurada ainda. Aguardando...');
    }

    // Verificar agora e depois a cada intervalo
    await checkScheduledMessages();

    setInterval(async () => {
        await checkScheduledMessages();
    }, CHECK_INTERVAL);

    log(`\n🔄 Polling ativo (a cada ${CHECK_INTERVAL / 1000}s). Pressione Ctrl+C para parar.\n`);
}

start();
