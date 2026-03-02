import { WhatsAppInstance, WhatsAppMessage, EvolutionConfig } from '../types/whatsapp.types';

export class WhatsAppService {
    private apiUrl: string;
    private apiKey: string;

    constructor(config: EvolutionConfig) {
        this.apiUrl = config.apiUrl;
        this.apiKey = config.apiKey;
    }

    /**
     * Cria uma nova instância na Evolution API.
     */
    async createInstance(instanceName: string) {
        const response = await fetch(`${this.apiUrl}/instance/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': this.apiKey
            },
            body: JSON.stringify({
                instanceName,
                integration: 'WHATSAPP-BAILEYS',
                qrcode: true
            })
        });

        if (!response.ok) {
            const error = await response.json();
            const msg = error?.response?.message?.[0] || error?.message || 'Falha ao criar instância';
            throw new Error(msg);
        }

        return response.json();
    }

    /**
     * Busca o QR Code de uma instância conectada.
     */
    async getQRCode(instanceName: string) {
        const response = await fetch(`${this.apiUrl}/instance/connect/${instanceName}`, {
            method: 'GET',
            headers: {
                'apikey': this.apiKey
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Falha ao obter QR Code');
        }

        return response.json();
    }

    /**
     * Envia uma mensagem de texto.
     */
    async sendMessage(instanceName: string, instanceToken: string, number: string, text: string) {
        const response = await fetch(`${this.apiUrl}/message/sendText/${instanceName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': instanceToken // Usando o token da instância conforme blueprint
            },
            body: JSON.stringify({
                number,
                text,
                delay: 1200,
                linkPreview: true
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Falha ao enviar mensagem');
        }

        return response.json();
    }

    /**
     * Remove uma instância da Evolution API.
     */
    async deleteInstance(instanceName: string) {
        // Tentar logout (ignorar se falhar — instância pode já estar offline)
        try {
            await fetch(`${this.apiUrl}/instance/logout/${instanceName}`, {
                method: 'DELETE',
                headers: { 'apikey': this.apiKey }
            });
        } catch (e) {
            // Silencioso
        }

        // Tentar deletar na API (ignorar 404 — pode não existir lá)
        try {
            const deleteResponse = await fetch(`${this.apiUrl}/instance/delete/${instanceName}`, {
                method: 'DELETE',
                headers: { 'apikey': this.apiKey }
            });
            if (deleteResponse.ok) {
                return deleteResponse.json();
            }
        } catch (e) {
            // Silencioso
        }

        // Retorna sucesso mesmo se a API não tinha a instância
        return { success: true };
    }

    /**
     * Verifica o status da conexão da instância.
     */
    async getConnectionStatus(instanceName: string) {
        const response = await fetch(`${this.apiUrl}/instance/connectionState/${instanceName}`, {
            method: 'GET',
            headers: {
                'apikey': this.apiKey
            }
        });

        if (!response.ok) {
            return { instance: { state: 'disconnected' } };
        }

        return response.json();
    }
}
