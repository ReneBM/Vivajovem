export interface WhatsAppInstance {
    id: string;
    name: string;
    token?: string;
    instance_key?: string;
    status: 'disconnected' | 'connected' | 'qr_ready';
    qrcode?: string;
    last_seen?: string;
    owner_id?: string;
    created_at?: string;
    updated_at?: string;
}

export interface WhatsAppMessage {
    id: string;
    instance_id: string;
    number: string;
    message: string;
    direction: 'inbound' | 'outbound';
    status: 'sent' | 'received' | 'read' | 'failure';
    external_id?: string;
    created_at?: string;
}

export interface EvolutionConfig {
    apiUrl: string;
    apiKey: string;
}
