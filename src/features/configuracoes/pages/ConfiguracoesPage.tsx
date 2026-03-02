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

  // Evolution API WhatsApp config
  const [whatsappConfig, setWhatsappConfig] = useState({
    api_url: '',
    api_key: '',
    instance_name: '',
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
          api_url: config.api_url || '',
          api_key: config.api_key || '',
          instance_name: config.instance_name || '',
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
          .update({
            configuracao: whatsappConfig,
            ativa: Boolean(whatsappConfig.api_url && whatsappConfig.api_key && whatsappConfig.instance_name)
          })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('api_configurations').insert({
          tipo: 'whatsapp',
          nome: 'Evolution API',
          configuracao: whatsappConfig,
          ativa: Boolean(whatsappConfig.api_url && whatsappConfig.api_key && whatsappConfig.instance_name),
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
              <CardDescription>Altere sua senha de acesso</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const senhaAtual = (form.elements.namedItem('senhaAtual') as HTMLInputElement).value;
                  const novaSenha = (form.elements.namedItem('novaSenha') as HTMLInputElement).value;
                  const confirmarSenha = (form.elements.namedItem('confirmarSenha') as HTMLInputElement).value;

                  if (novaSenha.length < 8) { toast.error('A nova senha deve ter no mínimo 8 caracteres'); return; }
                  if (!/[A-Z]/.test(novaSenha)) { toast.error('A nova senha deve conter pelo menos uma letra maiúscula'); return; }
                  if (!/[0-9]/.test(novaSenha)) { toast.error('A nova senha deve conter pelo menos um número'); return; }
                  if (novaSenha !== confirmarSenha) { toast.error('As senhas não coincidem'); return; }

                  setSaving(true);
                  try {
                    // Verificar senha atual fazendo login
                    const { error: loginError } = await supabase.auth.signInWithPassword({
                      email: user?.email || '',
                      password: senhaAtual,
                    });
                    if (loginError) { toast.error('Senha atual incorreta'); setSaving(false); return; }

                    // Atualizar para a nova senha
                    const { error: updateError } = await supabase.auth.updateUser({ password: novaSenha });
                    if (updateError) throw updateError;

                    toast.success('Senha alterada com sucesso!');
                    form.reset();
                  } catch (error: any) {
                    toast.error('Erro ao alterar senha: ' + (error.message || 'Tente novamente'));
                  } finally {
                    setSaving(false);
                  }
                }}
                className="space-y-4"
              >
                <div className="grid gap-2">
                  <Label htmlFor="senhaAtual">Senha Atual *</Label>
                  <Input id="senhaAtual" name="senhaAtual" type="password" placeholder="Digite sua senha atual" required />
                </div>
                <Separator />
                <div className="grid gap-2">
                  <Label htmlFor="novaSenha">Nova Senha *</Label>
                  <Input id="novaSenha" name="novaSenha" type="password" placeholder="Mínimo 8 caracteres, 1 maiúscula, 1 número" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirmarSenha">Confirmar Nova Senha *</Label>
                  <Input id="confirmarSenha" name="confirmarSenha" type="password" placeholder="Repita a nova senha" required />
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Key className="w-4 h-4 mr-2" />}
                    Alterar Senha
                  </Button>
                </div>
              </form>
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
                  <CardTitle className="font-display">Evolution API (WhatsApp)</CardTitle>
                </div>
                {whatsappActive ? (
                  <Badge className="bg-success/10 text-success"><CheckCircle className="w-3 h-3 mr-1" />Configurado</Badge>
                ) : (
                  <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" />Não configurado</Badge>
                )}
              </div>
              <CardDescription>Configure sua instância da Evolution API para enviar mensagens via WhatsApp</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>URL Base da API</Label>
                  <Input
                    value={whatsappConfig.api_url}
                    onChange={(e) => setWhatsappConfig({ ...whatsappConfig, api_url: e.target.value })}
                    placeholder="https://sua-api.com"
                  />
                  <p className="text-xs text-muted-foreground">URL onde a Evolution API está instalada</p>
                </div>
                <div className="grid gap-2">
                  <Label>API Key (Global ou da Instância)</Label>
                  <Input
                    type="password"
                    value={whatsappConfig.api_key}
                    onChange={(e) => setWhatsappConfig({ ...whatsappConfig, api_key: e.target.value })}
                    placeholder="Token de segurança"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Nome da Instância</Label>
                  <Input
                    value={whatsappConfig.instance_name}
                    onChange={(e) => setWhatsappConfig({ ...whatsappConfig, instance_name: e.target.value })}
                    placeholder="Ex: VivaJovem"
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
