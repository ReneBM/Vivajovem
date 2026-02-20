import { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  User,
  Shield,
  Bell,
  Database,
  Key,
  Save,
  Loader2,
  Sparkles,
  MessageCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface ApiConfig {
  id: string;
  tipo: string;
  nome: string;
  configuracao: Record<string, unknown>;
  ativa: boolean;
}

export default function Configuracoes() {
  const { user } = useAuth();
  const [apiConfigs, setApiConfigs] = useState<ApiConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Z-API WhatsApp config
  const [whatsappConfig, setWhatsappConfig] = useState({
    instance_id: '',
    instance_token: '',
    api_url: '',
  });

  // AI config
  const [aiConfig, setAiConfig] = useState({
    provider: 'gemini',
    model: 'gemini-2.5-flash',
  });

  useEffect(() => { fetchApiConfigs(); }, []);

  async function fetchApiConfigs() {
    try {
      const { data, error } = await supabase.from('api_configurations').select('*').order('tipo');
      if (error) throw error;
      const configs = (data as ApiConfig[]) || [];
      setApiConfigs(configs);

      const whatsapp = configs.find((c) => c.tipo === 'whatsapp');
      if (whatsapp) {
        const config = whatsapp.configuracao as Record<string, string>;
        setWhatsappConfig({
          instance_id: config.instance_id || '',
          instance_token: config.instance_token || '',
          api_url: config.api_url || '',
        });
      }

      const ai = configs.find((c) => c.tipo === 'ai');
      if (ai) {
        const config = ai.configuracao as Record<string, string>;
        setAiConfig({ provider: config.provider || 'gemini', model: config.model || 'gemini-2.5-flash' });
      }
    } catch (error) {
      console.error('Error fetching API configs:', error);
    } finally {
      setLoading(false);
    }
  }

  async function saveWhatsappConfig() {
    setSaving(true);
    try {
      const existing = apiConfigs.find((c) => c.tipo === 'whatsapp');
      if (existing) {
        const { error } = await supabase.from('api_configurations')
          .update({ configuracao: whatsappConfig, ativa: Boolean(whatsappConfig.instance_id && whatsappConfig.instance_token) })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('api_configurations').insert({
          tipo: 'whatsapp',
          nome: 'Z-API WhatsApp',
          configuracao: whatsappConfig,
          ativa: Boolean(whatsappConfig.instance_id && whatsappConfig.instance_token),
        });
        if (error) throw error;
      }
      toast.success('Configuração do WhatsApp salva!');
      fetchApiConfigs();
    } catch (error) {
      toast.error('Erro ao salvar configuração');
    } finally {
      setSaving(false);
    }
  }

  async function saveAiConfig() {
    setSaving(true);
    try {
      const existing = apiConfigs.find((c) => c.tipo === 'ai');
      if (existing) {
        const { error } = await supabase.from('api_configurations').update({ configuracao: aiConfig, ativa: true }).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('api_configurations').insert({ tipo: 'ai', nome: 'API de IA', configuracao: aiConfig, ativa: true });
        if (error) throw error;
      }
      toast.success('Configuração de IA salva!');
      fetchApiConfigs();
    } catch (error) {
      toast.error('Erro ao salvar configuração');
    } finally {
      setSaving(false);
    }
  }

  function getInitials(email: string) { return email.slice(0, 2).toUpperCase(); }

  const whatsappActive = apiConfigs.find((c) => c.tipo === 'whatsapp')?.ativa;
  const aiActive = apiConfigs.find((c) => c.tipo === 'ai')?.ativa;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground mt-1">Gerencie suas preferências e configurações do sistema</p>
      </div>

      <Tabs defaultValue="perfil">
        <TabsList>
          <TabsTrigger value="perfil">Perfil</TabsTrigger>
          <TabsTrigger value="apis">APIs</TabsTrigger>
          <TabsTrigger value="sistema">Sistema</TabsTrigger>
        </TabsList>

        <TabsContent value="perfil" className="space-y-6 mt-6">
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center gap-2"><User className="w-5 h-5 text-primary" /><CardTitle className="font-display">Perfil</CardTitle></div>
              <CardDescription>Suas informações pessoais e conta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">{user?.email ? getInitials(user.email) : 'U'}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-foreground text-lg">{user?.email}</h3>
                  <Badge className="mt-2 bg-primary/10 text-primary">Usuário</Badge>
                </div>
              </div>
              <Separator />
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Email</Label>
                  <Input type="email" value={user?.email || ''} disabled className="bg-muted" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center gap-2"><Shield className="w-5 h-5 text-primary" /><CardTitle className="font-display">Segurança</CardTitle></div>
              <CardDescription>Configurações de segurança da sua conta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <Key className="w-5 h-5 text-muted-foreground" />
                  <div><p className="font-medium">Alterar senha</p><p className="text-sm text-muted-foreground">Atualize sua senha de acesso</p></div>
                </div>
                <Button variant="outline">Alterar</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="apis" className="space-y-6 mt-6">
          {/* Z-API WhatsApp */}
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-success" />
                  <CardTitle className="font-display">Z-API WhatsApp</CardTitle>
                </div>
                {whatsappActive ? (
                  <Badge className="bg-success/10 text-success"><CheckCircle className="w-3 h-3 mr-1" />Configurado</Badge>
                ) : (
                  <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" />Não configurado</Badge>
                )}
              </div>
              <CardDescription>Configure sua instância Z-API para enviar mensagens via WhatsApp</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>API da Instância (URL)</Label>
                  <Input
                    value={whatsappConfig.api_url}
                    onChange={(e) => setWhatsappConfig({ ...whatsappConfig, api_url: e.target.value })}
                    placeholder="https://api.z-api.io/instances/..."
                  />
                  <p className="text-xs text-muted-foreground">URL completa da API da instância Z-API</p>
                </div>
                <div className="grid gap-2">
                  <Label>ID da Instância</Label>
                  <Input
                    value={whatsappConfig.instance_id}
                    onChange={(e) => setWhatsappConfig({ ...whatsappConfig, instance_id: e.target.value })}
                    placeholder="Ex: 3EE9CC1B..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Token da Instância</Label>
                  <Input
                    type="password"
                    value={whatsappConfig.instance_token}
                    onChange={(e) => setWhatsappConfig({ ...whatsappConfig, instance_token: e.target.value })}
                    placeholder="Token de acesso da instância"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={saveWhatsappConfig} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Salvar Configuração
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* AI API */}
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" /><CardTitle className="font-display">API de Inteligência Artificial</CardTitle></div>
                {aiActive ? (
                  <Badge className="bg-success/10 text-success"><CheckCircle className="w-3 h-3 mr-1" />Configurado</Badge>
                ) : (
                  <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" />Não configurado</Badge>
                )}
              </div>
              <CardDescription>Configure a API de IA para funcionalidades avançadas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                <div className="flex items-center gap-2 mb-2"><CheckCircle className="w-4 h-4 text-success" /><span className="font-medium text-success">API Configurada</span></div>
                <p className="text-sm text-muted-foreground">A API de IA (Google Gemini) já está configurada e pronta para uso no sistema.</p>
              </div>
              <div className="grid gap-4">
                <div className="grid gap-2"><Label>Provedor</Label><Input value="Google Gemini" disabled className="bg-muted" /></div>
                <div className="grid gap-2"><Label>Modelo</Label><Input value="gemini-2.5-flash" disabled className="bg-muted" /></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sistema" className="space-y-6 mt-6">
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center gap-2"><Bell className="w-5 h-5 text-primary" /><CardTitle className="font-display">Notificações</CardTitle></div>
              <CardDescription>Configure suas preferências de notificação</CardDescription>
            </CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">Em breve você poderá configurar notificações por email e push.</p></CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center gap-2"><Database className="w-5 h-5 text-primary" /><CardTitle className="font-display">Sistema</CardTitle></div>
              <CardDescription>Informações sobre o sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Versão</span><span className="font-medium">1.0.0</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Ambiente</span><Badge variant="secondary">Produção</Badge></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
