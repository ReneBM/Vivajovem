import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WhatsAppConfig {
  phone_number_id: string;
  access_token: string;
  webhook_verify_token: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get WhatsApp configuration
    const { data: configData, error: configError } = await supabase
      .from("api_configurations")
      .select("configuracao, ativa")
      .eq("tipo", "whatsapp")
      .single();

    if (configError || !configData) {
      return new Response(
        JSON.stringify({ 
          connected: false,
          error: "WhatsApp API não configurada",
          details: "Configure a API do WhatsApp em Configurações > APIs"
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    if (!configData.ativa) {
      return new Response(
        JSON.stringify({ 
          connected: false,
          error: "WhatsApp API desativada",
          details: "Ative a API do WhatsApp nas configurações"
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const config = configData.configuracao as unknown as WhatsAppConfig;

    if (!config.phone_number_id || !config.access_token) {
      return new Response(
        JSON.stringify({ 
          connected: false,
          error: "Configuração incompleta",
          details: "Phone Number ID e Access Token são obrigatórios"
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Test connection by getting phone number details
    const testUrl = `https://graph.facebook.com/v18.0/${config.phone_number_id}`;
    
    const response = await fetch(testUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${config.access_token}`,
      },
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error("WhatsApp API test error:", responseData);
      
      let errorMessage = "Erro ao conectar";
      if (responseData.error?.code === 190) {
        errorMessage = "Token de acesso inválido ou expirado";
      } else if (responseData.error?.code === 100) {
        errorMessage = "Phone Number ID inválido";
      } else if (responseData.error?.message) {
        errorMessage = responseData.error.message;
      }

      return new Response(
        JSON.stringify({ 
          connected: false,
          error: errorMessage,
          code: responseData.error?.code
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log("WhatsApp connection test successful:", responseData);

    return new Response(
      JSON.stringify({ 
        connected: true,
        phone_number: responseData.display_phone_number || responseData.verified_name,
        verified_name: responseData.verified_name,
        quality_rating: responseData.quality_rating,
        platform_type: responseData.platform_type
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ 
        connected: false,
        error: error instanceof Error ? error.message : "Erro interno" 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
