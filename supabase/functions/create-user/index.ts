import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateUserRequest {
    email: string;
    password: string;
    nome: string;
    role_ids?: string[];
}

Deno.serve(async (req) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // Parse body com proteção
        let body: CreateUserRequest;
        try {
            const text = await req.text();
            if (!text || text.trim().length === 0) {
                return new Response(
                    JSON.stringify({ error: "Corpo da requisição vazio" }),
                    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }
            body = JSON.parse(text);
        } catch (_parseError) {
            return new Response(
                JSON.stringify({ error: "JSON inválido no corpo da requisição" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Verificar se o usuário que fez a requisição está autenticado
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: "Não autorizado" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const token = authHeader.replace("Bearer ", "");
        const { data: { user: callerUser }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !callerUser) {
            return new Response(
                JSON.stringify({ error: "Token inválido ou sessão expirada" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const { email, password, nome, role_ids } = body;

        if (!email || !password || !nome) {
            return new Response(
                JSON.stringify({ error: "Email, senha e nome são obrigatórios" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        if (password.length < 6) {
            return new Response(
                JSON.stringify({ error: "Senha deve ter no mínimo 6 caracteres" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Criar o usuário via Admin API (sem confirmação de email)
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { nome },
        });

        if (createError) {
            console.error("Erro ao criar usuário:", createError);

            if (createError.message?.includes("already been registered") || createError.message?.includes("already exists")) {
                return new Response(
                    JSON.stringify({ error: "Este email já está cadastrado" }),
                    { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            return new Response(
                JSON.stringify({ error: createError.message || "Erro ao criar usuário" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const userId = newUser.user.id;

        // Garantir criação do profile (upsert para evitar conflito com trigger)
        await supabase.from("profiles").upsert({
            user_id: userId,
            nome: nome,
            email: email,
        }, { onConflict: "user_id" });

        // Garantir role padrão USUARIO (upsert para evitar conflito com trigger)
        await supabase.from("user_roles").upsert({
            user_id: userId,
            role: "USUARIO",
        }, { onConflict: "user_id,role" });

        // Atribuir funções personalizadas se fornecidas
        if (role_ids && role_ids.length > 0) {
            const roleInserts = role_ids.map((roleId: string) => ({
                user_id: userId,
                role_id: roleId,
            }));

            const { error: roleError } = await supabase.from("user_custom_roles").insert(roleInserts);
            if (roleError) {
                console.error("Erro ao atribuir funções:", roleError);
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                user: { id: userId, email: newUser.user.email },
            }),
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
