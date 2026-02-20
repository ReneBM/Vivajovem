export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    // Allows to automatically instantiate createClient with right options
    // @see https://supabase.com/docs/reference/javascript/typescript-support
    graphql_public: {
        Tables: Record<string, never>
        Views: Record<string, never>
        Functions: {
            graphql: {
                Args: {
                    operationName?: string
                    query?: string
                    variables?: Json
                    extensions?: Json
                }
                Returns: Json
            }
        }
        Enums: Record<string, never>
        CompositeTypes: Record<string, never>
    }
    public: {
        Tables: {
            api_configurations: {
                Row: {
                    id: string
                    tipo: string
                    nome: string
                    configuracao: Json
                    ativa: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    tipo: string
                    nome: string
                    configuracao: Json
                    ativa?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    tipo?: string
                    nome?: string
                    configuracao?: Json
                    ativa?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            campanhas: {
                Row: {
                    id: string
                    nome: string
                    descricao: string | null
                    data_inicio: string
                    data_fim: string | null
                    ativa: boolean
                    slug: string | null
                    campos_personalizados: Json | null
                    cor_primaria: string | null
                    cor_fundo: string | null
                    imagem_capa_url: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    nome: string
                    descricao?: string | null
                    data_inicio: string
                    data_fim?: string | null
                    ativa?: boolean
                    slug?: string | null
                    campos_personalizados?: Json | null
                    cor_primaria?: string | null
                    cor_fundo?: string | null
                    imagem_capa_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    nome?: string
                    descricao?: string | null
                    data_inicio?: string
                    data_fim?: string | null
                    ativa?: boolean
                    slug?: string | null
                    campos_personalizados?: Json | null
                    cor_primaria?: string | null
                    cor_fundo?: string | null
                    imagem_capa_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            eventos: {
                Row: {
                    id: string
                    titulo: string
                    descricao: string | null
                    data_evento: string
                    tipo: string
                    grupo_id: string | null
                    campanha_id: string | null
                    criado_por: string | null
                    recorrente_id: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    titulo: string
                    descricao?: string | null
                    data_evento: string
                    tipo?: string
                    grupo_id?: string | null
                    campanha_id?: string | null
                    criado_por?: string | null
                    recorrente_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    titulo?: string
                    descricao?: string | null
                    data_evento?: string
                    tipo?: string
                    grupo_id?: string | null
                    campanha_id?: string | null
                    criado_por?: string | null
                    recorrente_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "eventos_grupo_id_fkey"
                        columns: ["grupo_id"]
                        isOneToOne: false
                        referencedRelation: "grupos"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "eventos_campanha_id_fkey"
                        columns: ["campanha_id"]
                        isOneToOne: false
                        referencedRelation: "campanhas"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "eventos_recorrente_id_fkey"
                        columns: ["recorrente_id"]
                        isOneToOne: false
                        referencedRelation: "eventos_recorrentes"
                        referencedColumns: ["id"]
                    },
                ]
            }
            eventos_recorrentes: {
                Row: {
                    id: string
                    titulo: string
                    descricao: string | null
                    tipo: string
                    grupo_id: string | null
                    campanha_id: string | null
                    hora_evento: string
                    tipo_recorrencia: string
                    dia_semana: number | null
                    intervalo_dias: number | null
                    posicao_no_mes: number | null
                    dia_do_mes: number | null
                    data_inicio: string
                    data_fim: string | null
                    ativo: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    titulo: string
                    descricao?: string | null
                    tipo?: string
                    grupo_id?: string | null
                    campanha_id?: string | null
                    hora_evento?: string
                    tipo_recorrencia: string
                    dia_semana?: number | null
                    intervalo_dias?: number | null
                    posicao_no_mes?: number | null
                    dia_do_mes?: number | null
                    data_inicio?: string
                    data_fim?: string | null
                    ativo?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    titulo?: string
                    descricao?: string | null
                    tipo?: string
                    grupo_id?: string | null
                    campanha_id?: string | null
                    hora_evento?: string
                    tipo_recorrencia?: string
                    dia_semana?: number | null
                    intervalo_dias?: number | null
                    posicao_no_mes?: number | null
                    dia_do_mes?: number | null
                    data_inicio?: string
                    data_fim?: string | null
                    ativo?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "eventos_recorrentes_grupo_id_fkey"
                        columns: ["grupo_id"]
                        isOneToOne: false
                        referencedRelation: "grupos"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "eventos_recorrentes_campanha_id_fkey"
                        columns: ["campanha_id"]
                        isOneToOne: false
                        referencedRelation: "campanhas"
                        referencedColumns: ["id"]
                    },
                ]
            }
            grupos: {
                Row: {
                    id: string
                    nome: string
                    descricao: string | null
                    lider_id: string | null
                    ativo: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    nome: string
                    descricao?: string | null
                    lider_id?: string | null
                    ativo?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    nome?: string
                    descricao?: string | null
                    lider_id?: string | null
                    ativo?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "grupos_lider_id_fkey"
                        columns: ["lider_id"]
                        isOneToOne: false
                        referencedRelation: "lideres"
                        referencedColumns: ["id"]
                    },
                ]
            }
            historico_relacionamento: {
                Row: {
                    id: string
                    jovem_id: string
                    status_relacionamento: string
                    data_inicio: string
                    data_fim: string | null
                    observacao: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    jovem_id: string
                    status_relacionamento: string
                    data_inicio?: string
                    data_fim?: string | null
                    observacao?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    jovem_id?: string
                    status_relacionamento?: string
                    data_inicio?: string
                    data_fim?: string | null
                    observacao?: string | null
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "historico_relacionamento_jovem_id_fkey"
                        columns: ["jovem_id"]
                        isOneToOne: false
                        referencedRelation: "jovens"
                        referencedColumns: ["id"]
                    },
                ]
            }
            inscricoes_campanha: {
                Row: {
                    id: string
                    campanha_id: string
                    jovem_id: string | null
                    nome_visitante: string | null
                    telefone: string | null
                    idade: number | null
                    dados: Json | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    campanha_id: string
                    jovem_id?: string | null
                    nome_visitante?: string | null
                    telefone?: string | null
                    idade?: number | null
                    dados?: Json | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    campanha_id?: string
                    jovem_id?: string | null
                    nome_visitante?: string | null
                    telefone?: string | null
                    idade?: number | null
                    dados?: Json | null
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "inscricoes_campanha_campanha_id_fkey"
                        columns: ["campanha_id"]
                        isOneToOne: false
                        referencedRelation: "campanhas"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "inscricoes_campanha_jovem_id_fkey"
                        columns: ["jovem_id"]
                        isOneToOne: false
                        referencedRelation: "jovens"
                        referencedColumns: ["id"]
                    },
                ]
            }
            inscricoes_evento: {
                Row: {
                    id: string
                    evento_id: string | null
                    slug: string
                    titulo: string
                    descricao: string | null
                    cor_primaria: string
                    cor_fundo: string
                    imagem_capa_url: string | null
                    imagem_titulo_url: string | null
                    campos_personalizados: Json
                    max_vagas: number | null
                    data_limite: string | null
                    ativa: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    evento_id?: string | null
                    slug: string
                    titulo: string
                    descricao?: string | null
                    cor_primaria?: string
                    cor_fundo?: string
                    imagem_capa_url?: string | null
                    imagem_titulo_url?: string | null
                    campos_personalizados?: Json
                    max_vagas?: number | null
                    data_limite?: string | null
                    ativa?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    evento_id?: string | null
                    slug?: string
                    titulo?: string
                    descricao?: string | null
                    cor_primaria?: string
                    cor_fundo?: string
                    imagem_capa_url?: string | null
                    imagem_titulo_url?: string | null
                    campos_personalizados?: Json
                    max_vagas?: number | null
                    data_limite?: string | null
                    ativa?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "inscricoes_evento_evento_id_fkey"
                        columns: ["evento_id"]
                        isOneToOne: false
                        referencedRelation: "eventos"
                        referencedColumns: ["id"]
                    },
                ]
            }
            inscricoes_evento_respostas: {
                Row: {
                    id: string
                    inscricao_id: string
                    dados: Json
                    created_at: string
                }
                Insert: {
                    id?: string
                    inscricao_id: string
                    dados?: Json
                    created_at?: string
                }
                Update: {
                    id?: string
                    inscricao_id?: string
                    dados?: Json
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "inscricoes_evento_respostas_inscricao_id_fkey"
                        columns: ["inscricao_id"]
                        isOneToOne: false
                        referencedRelation: "inscricoes_evento"
                        referencedColumns: ["id"]
                    },
                ]
            }
            jovens: {
                Row: {
                    id: string
                    nome: string
                    data_nascimento: string | null
                    telefone: string | null
                    foto_url: string | null
                    redes_sociais: Json | null
                    grupo_id: string | null
                    status: string
                    titulo_eclesiastico: string | null
                    batizado: boolean
                    status_relacionamento: string | null
                    cpf: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    nome: string
                    data_nascimento?: string | null
                    telefone?: string | null
                    foto_url?: string | null
                    redes_sociais?: Json | null
                    grupo_id?: string | null
                    status?: string
                    titulo_eclesiastico?: string | null
                    batizado?: boolean
                    status_relacionamento?: string | null
                    cpf?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    nome?: string
                    data_nascimento?: string | null
                    telefone?: string | null
                    foto_url?: string | null
                    redes_sociais?: Json | null
                    grupo_id?: string | null
                    status?: string
                    titulo_eclesiastico?: string | null
                    batizado?: boolean
                    status_relacionamento?: string | null
                    cpf?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "jovens_grupo_id_fkey"
                        columns: ["grupo_id"]
                        isOneToOne: false
                        referencedRelation: "grupos"
                        referencedColumns: ["id"]
                    },
                ]
            }
            jovens_visitantes: {
                Row: {
                    id: string
                    nome: string
                    telefone: string | null
                    email: string | null
                    idade: number | null
                    faz_parte_viva_jovem: boolean
                    evento_origem_id: string | null
                    observacao: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    nome: string
                    telefone?: string | null
                    email?: string | null
                    idade?: number | null
                    faz_parte_viva_jovem?: boolean
                    evento_origem_id?: string | null
                    observacao?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    nome?: string
                    telefone?: string | null
                    email?: string | null
                    idade?: number | null
                    faz_parte_viva_jovem?: boolean
                    evento_origem_id?: string | null
                    observacao?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "jovens_visitantes_evento_origem_id_fkey"
                        columns: ["evento_origem_id"]
                        isOneToOne: false
                        referencedRelation: "eventos"
                        referencedColumns: ["id"]
                    },
                ]
            }
            lideres: {
                Row: {
                    id: string
                    nome: string
                    user_id: string | null
                    email: string | null
                    telefone: string | null
                    foto_url: string | null
                    status: string
                    titulo_eclesiastico: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    nome: string
                    user_id?: string | null
                    email?: string | null
                    telefone?: string | null
                    foto_url?: string | null
                    status?: string
                    titulo_eclesiastico?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    nome?: string
                    user_id?: string | null
                    email?: string | null
                    telefone?: string | null
                    foto_url?: string | null
                    status?: string
                    titulo_eclesiastico?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            nucleo_lideres: {
                Row: {
                    id: string
                    grupo_id: string
                    lider_id: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    grupo_id: string
                    lider_id: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    grupo_id?: string
                    lider_id?: string
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "nucleo_lideres_grupo_id_fkey"
                        columns: ["grupo_id"]
                        isOneToOne: false
                        referencedRelation: "grupos"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "nucleo_lideres_lider_id_fkey"
                        columns: ["lider_id"]
                        isOneToOne: false
                        referencedRelation: "lideres"
                        referencedColumns: ["id"]
                    },
                ]
            }
            nucleo_membros: {
                Row: {
                    id: string
                    nucleo_id: string
                    lider_id: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    nucleo_id: string
                    lider_id: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    nucleo_id?: string
                    lider_id?: string
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "nucleo_membros_nucleo_id_fkey"
                        columns: ["nucleo_id"]
                        isOneToOne: false
                        referencedRelation: "nucleos"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "nucleo_membros_lider_id_fkey"
                        columns: ["lider_id"]
                        isOneToOne: false
                        referencedRelation: "lideres"
                        referencedColumns: ["id"]
                    },
                ]
            }
            nucleos: {
                Row: {
                    id: string
                    nome: string
                    descricao: string | null
                    ativo: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    nome: string
                    descricao?: string | null
                    ativo?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    nome?: string
                    descricao?: string | null
                    ativo?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            presencas: {
                Row: {
                    id: string
                    evento_id: string
                    jovem_id: string
                    presente: boolean
                    registrado_por: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    evento_id: string
                    jovem_id: string
                    presente?: boolean
                    registrado_por?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    evento_id?: string
                    jovem_id?: string
                    presente?: boolean
                    registrado_por?: string | null
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "presencas_evento_id_fkey"
                        columns: ["evento_id"]
                        isOneToOne: false
                        referencedRelation: "eventos"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "presencas_jovem_id_fkey"
                        columns: ["jovem_id"]
                        isOneToOne: false
                        referencedRelation: "jovens"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "presencas_registrado_por_fkey"
                        columns: ["registrado_por"]
                        isOneToOne: false
                        referencedRelation: "lideres"
                        referencedColumns: ["id"]
                    },
                ]
            }
            profiles: {
                Row: {
                    id: string
                    user_id: string
                    nome: string
                    email: string
                    status: string
                    ultimo_acesso: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    nome: string
                    email: string
                    status?: string
                    ultimo_acesso?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    nome?: string
                    email?: string
                    status?: string
                    ultimo_acesso?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            roles: {
                Row: {
                    id: string
                    nome: string
                    descricao: string | null
                    permissoes: Json
                    atribuivel_por: string[] | null
                    cor: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    nome: string
                    descricao?: string | null
                    permissoes?: Json
                    atribuivel_por?: string[] | null
                    cor?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    nome?: string
                    descricao?: string | null
                    permissoes?: Json
                    atribuivel_por?: string[] | null
                    cor?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            tipos_evento: {
                Row: {
                    id: string
                    nome: string
                    cor: string
                    ativo: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    nome: string
                    cor?: string
                    ativo?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    nome?: string
                    cor?: string
                    ativo?: boolean
                    created_at?: string
                }
                Relationships: []
            }
            user_custom_roles: {
                Row: {
                    id: string
                    user_id: string
                    role_id: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    role_id: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    role_id?: string
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "user_custom_roles_role_id_fkey"
                        columns: ["role_id"]
                        isOneToOne: false
                        referencedRelation: "roles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            user_roles: {
                Row: {
                    id: string
                    user_id: string
                    role: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    role: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    role?: string
                }
                Relationships: []
            }
            whatsapp_mensagens: {
                Row: {
                    id: string
                    mensagem: string
                    tipo: string
                    status: string
                    destinatarios: Json
                    agendado_para: string | null
                    enviado_em: string | null
                    erro: string | null
                    created_by: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    mensagem: string
                    tipo?: string
                    status?: string
                    destinatarios?: Json
                    agendado_para?: string | null
                    enviado_em?: string | null
                    erro?: string | null
                    created_by?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    mensagem?: string
                    tipo?: string
                    status?: string
                    destinatarios?: Json
                    agendado_para?: string | null
                    enviado_em?: string | null
                    erro?: string | null
                    created_by?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
        }
        Views: Record<string, never>
        Functions: Record<string, never>
        Enums: Record<string, never>
        CompositeTypes: Record<string, never>
    }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
    PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
            Row: infer R
        }
    ? R
    : never
    : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
            Row: infer R
        }
    ? R
    : never
    : never

export type TablesInsert<
    PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Insert: infer I
    }
    ? I
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Update: infer U
    }
    ? U
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never

export type Enums<
    PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
    EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
    ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: keyof Database
    }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
    ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
