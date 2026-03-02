import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const payload = await req.json()
        const { event, data, instance } = payload

        console.log(`Recebido evento ${event} da instância ${instance}`)

        // 1. Processar mensagens recebidas
        if (event === 'messages.upsert') {
            const message = data.message
            const remoteJid = data.key.remoteJid
            const pushName = data.pushName
            const text = message.conversation || message.extendedTextMessage?.text || ''

            if (text && !data.key.fromMe) {
                // Buscar ID da instância no banco pelo nome
                const { data: instData } = await supabaseClient
                    .from('whatsapp_instances')
                    .select('id')
                    .eq('name', instance)
                    .single()

                if (instData) {
                    await supabaseClient.from('whatsapp_messages').insert({
                        instance_id: instData.id,
                        number: remoteJid.split('@')[0],
                        message: text,
                        direction: 'inbound',
                        status: 'received'
                    })
                }
            }
        }

        // 2. Processar atualizações de conexão
        if (event === 'connection.update') {
            const state = data.state
            let status = 'disconnected'
            if (state === 'open') status = 'connected'
            if (state === 'connecting') status = 'qr_ready'

            await supabaseClient
                .from('whatsapp_instances')
                .update({ status, last_seen: new Date().toISOString() })
                .eq('name', instance)
        }

        // 3. Processar novos QR Codes
        if (event === 'qrcode.updated') {
            const qrcode = data.qrcode.base64
            await supabaseClient
                .from('whatsapp_instances')
                .update({ status: 'qr_ready', qrcode })
                .eq('name', instance)
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error) {
        console.error(error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
