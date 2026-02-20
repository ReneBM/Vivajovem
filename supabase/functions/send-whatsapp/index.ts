import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ZApiConfig {
  instance_id: string;
  instance_token: string;
  api_url: string;
}

interface SendMessageRequest {
  message_id?: string;
  to: string;
  message: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get Z-API configuration
    const { data: configData, error: configError } = await supabase
      .from("api_configurations")
      .select("configuracao, ativa")
      .eq("tipo", "whatsapp")
      .single();

    if (configError || !configData) {
      return new Response(
        JSON.stringify({ error: "WhatsApp API não configurada", details: "Configure a Z-API em Configurações > APIs" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!configData.ativa) {
      return new Response(
        JSON.stringify({ error: "WhatsApp API desativada", details: "Ative a API do WhatsApp nas configurações" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const config = configData.configuracao as unknown as ZApiConfig;

    if (!config.instance_id || !config.instance_token) {
      return new Response(
        JSON.stringify({ error: "Configuração incompleta", details: "ID e Token da instância são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json() as SendMessageRequest;
    const { message_id, to, message } = body;

    // Format phone number
    let phoneNumber = to.replace(/\D/g, "");
    if (phoneNumber.startsWith("0")) {
      phoneNumber = "55" + phoneNumber.slice(1);
    } else if (!phoneNumber.startsWith("55")) {
      phoneNumber = "55" + phoneNumber;
    }

    // Build Z-API URL - use custom api_url or default
    const baseUrl = config.api_url || `https://api.z-api.io/instances/${config.instance_id}/token/${config.instance_token}`;
    const zapiUrl = `${baseUrl}/send-text`;

    const messagePayload = {
      phone: phoneNumber,
      message: message,
    };

    console.log(`Sending WhatsApp message via Z-API to ${phoneNumber}`);

    const response = await fetch(zapiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Client-Token": config.instance_token,
      },
      body: JSON.stringify(messagePayload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error("Z-API error:", responseData);

      if (message_id) {
        await supabase
          .from("whatsapp_mensagens")
          .update({ status: "falha", erro: JSON.stringify(responseData) })
          .eq("id", message_id);
      }

      return new Response(
        JSON.stringify({ error: "Erro ao enviar mensagem", details: responseData.message || "Erro desconhecido" }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (message_id) {
      await supabase
        .from("whatsapp_mensagens")
        .update({ status: "enviado", enviado_em: new Date().toISOString() })
        .eq("id", message_id);
    }

    console.log("WhatsApp message sent successfully via Z-API:", responseData);

    return new Response(
      JSON.stringify({ success: true, message_id: responseData.zapiMessageId, to: phoneNumber }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
