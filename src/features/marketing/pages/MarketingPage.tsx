import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Plus, Send, Clock, MessageCircle, Users, Loader2, CheckCircle,
  XCircle, AlertCircle, Search, Calendar, RefreshCw, FileText,
  Edit, Trash2, MoreHorizontal, Zap, Eye, User, Phone, Play, Ban, Timer,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { sendBulkMessages, getWhatsAppConfig } from '../services/whatsappService';

// ── Types ──
interface Destinatario {
  id: string;
  nome: string;
  telefone: string | null;
  tipo: 'jovem' | 'lider';
}

interface Mensagem {
  id: string;
  tipo: string;
  destinatarios: string[];
  mensagem: string;
  status: string;
  agendado_para: string | null;
  enviado_em: string | null;
  erro: string | null;
  created_at: string;
  created_by?: string;
}

interface Template {
  id: string;
  nome: string;
  mensagem: string;
  categoria: string;
}

// ── Component ──
export default function Marketing() {
  const { user } = useAuth();
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [destinatarios, setDestinatarios] = useState<Destinatario[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchDest, setSearchDest] = useState('');
  const [apiConfigured, setApiConfigured] = useState(false);

  // Templates sheet
  const [isTemplateSheetOpen, setIsTemplateSheetOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [templateForm, setTemplateForm] = useState({ nome: '', mensagem: '', categoria: 'geral' });

  // Message detail modal
  const [selectedMsg, setSelectedMsg] = useState<Mensagem | null>(null);
  const [senderName, setSenderName] = useState<string>('');
  const [recipientNames, setRecipientNames] = useState<{ phone: string; name: string }[]>([]);

  const [formData, setFormData] = useState({
    tipo: 'manual',
    mensagem: '',
    selectedIds: [] as string[],
    agendado_para: '',
    cadencia: 5,
    cadenciaMode: 'fixo' as 'fixo' | 'variavel',
    cadenciaMin: 1,
    cadenciaMax: 30,
  });

  useEffect(() => {
    fetchAll();
  }, []);

  // Polling para processar mensagens agendadas
  useEffect(() => {
    const interval = setInterval(async () => {
      await processScheduledMessages();
    }, 30000); // Verificar a cada 30 segundos
    return () => clearInterval(interval);
  }, [mensagens]);

  async function fetchAll() {
    await Promise.all([fetchMensagens(), fetchDestinatarios(), fetchTemplates(), checkApiConfig()]);
  }

  async function checkApiConfig() {
    const config = await getWhatsAppConfig();
    setApiConfigured(!!config);
  }

  async function fetchMensagens() {
    try {
      const { data, error } = await supabase
        .from('whatsapp_mensagens')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setMensagens((data as Mensagem[]) || []);
    } catch { toast.error('Erro ao carregar mensagens'); }
    finally { setLoading(false); }
  }

  async function fetchDestinatarios() {
    const { data: jovens } = await supabase.from('jovens').select('id, nome, telefone').eq('status', 'ATIVO').not('telefone', 'is', null).order('nome');
    const { data: lideres } = await supabase.from('lideres').select('id, nome, telefone').eq('status', 'ATIVO').not('telefone', 'is', null).order('nome');
    const all: Destinatario[] = [
      ...(jovens || []).map(j => ({ ...j, tipo: 'jovem' as const })),
      ...(lideres || []).map(l => ({ ...l, tipo: 'lider' as const })),
    ];
    setDestinatarios(all);
  }

  async function fetchTemplates() {
    const { data } = await supabase.from('whatsapp_templates').select('*').order('nome');
    setTemplates((data as Template[]) || []);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (formData.selectedIds.length === 0) {
      toast.error('Selecione pelo menos um destinatário');
      return;
    }
    setIsSubmitting(true);

    try {
      const selectedRecipients = destinatarios
        .filter(d => formData.selectedIds.includes(d.id))
        .map(d => ({ telefone: d.telefone || '', nome: d.nome }));

      const selectedPhones = selectedRecipients.map(r => r.telefone).filter(Boolean);

      const { data, error } = await supabase.from('whatsapp_mensagens').insert({
        tipo: formData.tipo,
        destinatarios: selectedPhones,
        mensagem: formData.mensagem,
        agendado_para: formData.tipo === 'agendada' && formData.agendado_para ? formData.agendado_para : null,
        status: 'pendente',
        created_by: user?.id,
      }).select().single();

      if (error) throw error;

      const newMsg = data as Mensagem;
      toast.success(
        formData.tipo === 'agendada'
          ? `Mensagem agendada para ${format(parseISO(formData.agendado_para), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}!`
          : 'Mensagem criada!'
      );
      setIsDialogOpen(false);
      setFormData({ tipo: 'manual', mensagem: '', selectedIds: [], agendado_para: '', cadencia: 5, cadenciaMode: 'fixo', cadenciaMin: 1, cadenciaMax: 30 });
      setSearchDest('');
      fetchMensagens();

      // Try to send if API is configured and not scheduled
      if (newMsg && formData.tipo !== 'agendada') {
        const delayConfig = formData.cadenciaMode === 'variavel'
          ? { mode: 'variavel' as const, min: formData.cadenciaMin * 1000, max: formData.cadenciaMax * 1000 }
          : { mode: 'fixo' as const, delay: formData.cadencia * 1000 };
        const result = await sendBulkMessages(newMsg.id, selectedRecipients, formData.mensagem, delayConfig);
        if (result.sent > 0) {
          toast.success(`${result.sent} mensagem(ns) enviada(s)!`);
          if (result.failed > 0) toast.warning(`${result.failed} falhou(aram)`);
        } else if (result.sent === 0 && result.failed === 0) {
          toast.info('API do WhatsApp não configurada. Mensagem salva como pendente.');
        }
        fetchMensagens();
      }
    } catch {
      toast.error('Erro ao criar mensagem');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function retrySend(msg: Mensagem) {
    toast.info('Reenviando...');
    // No retry, como o banco só guarda telefones hoje, tentamos reconstruir ou enviar simples.
    // Idealmente, o banco também deveria guardar o nome se quisermos personalizar no retry.
    const recipients = (msg.destinatarios || []).map(tel => ({ telefone: tel, nome: '' }));
    const result = await sendBulkMessages(msg.id, recipients, msg.mensagem);
    if (result.sent > 0) toast.success(`${result.sent} enviada(s)!`);
    else toast.error('Falha no reenvio');
    fetchMensagens();
  }

  function useTemplate(template: Template) {
    setFormData(prev => ({ ...prev, mensagem: template.mensagem }));
    toast.success(`Template "${template.nome}" aplicado!`);
  }

  // ── Processar mensagens agendadas ──
  async function processScheduledMessages() {
    const now = new Date();
    const agendadas = mensagens.filter(
      m => m.tipo === 'agendada' && m.status === 'pendente' && m.agendado_para
    );

    for (const msg of agendadas) {
      const scheduledTime = new Date(msg.agendado_para!);
      if (scheduledTime <= now) {
        toast.info(`Disparando mensagem agendada...`);
        const recipients = (msg.destinatarios || []).map(tel => ({ telefone: tel, nome: '' }));
        const result = await sendBulkMessages(msg.id, recipients, msg.mensagem);
        if (result.sent > 0) {
          toast.success(`Agendamento executado: ${result.sent} mensagem(ns) enviada(s)!`);
        } else {
          toast.error('Falha ao executar agendamento');
        }
        fetchMensagens();
      }
    }
  }

  async function sendScheduledNow(msg: Mensagem) {
    toast.info('Enviando mensagem agendada agora...');
    const recipients = (msg.destinatarios || []).map(tel => ({ telefone: tel, nome: '' }));
    const result = await sendBulkMessages(msg.id, recipients, msg.mensagem);
    if (result.sent > 0) toast.success(`${result.sent} mensagem(ns) enviada(s)!`);
    else toast.error('Falha ao enviar');
    fetchMensagens();
  }

  async function cancelScheduled(msg: Mensagem) {
    await supabase.from('whatsapp_mensagens').update({
      status: 'cancelado',
    } as any).eq('id', msg.id);
    toast.success('Agendamento cancelado');
    fetchMensagens();
  }

  // ── Message Detail Modal Logic ──
  async function openMessageDetail(msg: Mensagem) {
    setSelectedMsg(msg);
    setSenderName('Carregando...');
    setRecipientNames([]);

    // Buscar nome do remetente
    if (msg.created_by) {
      const { data: userData } = await supabase
        .from('usuarios')
        .select('nome')
        .eq('id', msg.created_by)
        .single();
      setSenderName(userData?.nome || 'Usuário desconhecido');
    } else {
      setSenderName('Sistema');
    }

    // Resolver telefones para nomes
    const phones = msg.destinatarios || [];
    const resolved: { phone: string; name: string }[] = [];
    for (const phone of phones) {
      const match = destinatarios.find(d => d.telefone === phone || d.telefone?.replace(/\D/g, '') === phone.replace(/\D/g, ''));
      resolved.push({ phone, name: match?.nome || phone });
    }
    setRecipientNames(resolved);
  }

  // Template CRUD
  async function saveTemplate() {
    try {
      if (editingTemplate) {
        await supabase.from('whatsapp_templates').update(templateForm).eq('id', editingTemplate.id);
        toast.success('Template atualizado!');
      } else {
        await supabase.from('whatsapp_templates').insert(templateForm as any);
        toast.success('Template criado!');
      }
      setEditingTemplate(null);
      setTemplateForm({ nome: '', mensagem: '', categoria: 'geral' });
      fetchTemplates();
    } catch { toast.error('Erro ao salvar template'); }
  }

  async function deleteTemplate(id: string) {
    await supabase.from('whatsapp_templates').delete().eq('id', id);
    toast.success('Template excluído');
    fetchTemplates();
  }

  const selectAll = () => setFormData(prev => ({ ...prev, selectedIds: destinatarios.map(d => d.id) }));
  const deselectAll = () => setFormData(prev => ({ ...prev, selectedIds: [] }));
  const toggleDest = (id: string) => setFormData(prev => ({
    ...prev,
    selectedIds: prev.selectedIds.includes(id)
      ? prev.selectedIds.filter(x => x !== id)
      : [...prev.selectedIds, id],
  }));

  const filteredDest = destinatarios.filter(d =>
    d.nome.toLowerCase().includes(searchDest.toLowerCase())
  );

  // Stats
  const stats = {
    total: mensagens.length,
    enviadas: mensagens.filter(m => m.status === 'enviado').length,
    pendentes: mensagens.filter(m => m.status === 'pendente').length,
    falhas: mensagens.filter(m => m.status === 'falha').length,
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { icon: React.ReactNode; label: string; className: string }> = {
      enviado: { icon: <CheckCircle className="w-3 h-3" />, label: 'Enviado', className: 'bg-success/10 text-success' },
      falha: { icon: <XCircle className="w-3 h-3" />, label: 'Falha', className: 'bg-destructive/10 text-destructive' },
      enviando: { icon: <Loader2 className="w-3 h-3 animate-spin" />, label: 'Enviando', className: 'bg-blue-500/10 text-blue-600' },
      cancelado: { icon: <Ban className="w-3 h-3" />, label: 'Cancelado', className: 'bg-muted text-muted-foreground' },
    };
    const s = map[status] || { icon: <AlertCircle className="w-3 h-3" />, label: 'Pendente', className: '' };
    return <Badge variant="secondary" className={s.className}>{s.icon} {s.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <MessageCircle className="w-8 h-8 text-primary" />
            WhatsApp
          </h1>
          <p className="text-muted-foreground mt-1">Envie mensagens para jovens e líderes</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsTemplateSheetOpen(true)}>
            <FileText className="w-4 h-4 mr-1" />Templates
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="hero"><Plus className="w-4 h-4" />Nova Mensagem</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-display">Nova Mensagem WhatsApp</DialogTitle>
                <DialogDescription>Crie e envie uma mensagem</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de envio</Label>
                    <Select value={formData.tipo} onValueChange={v => setFormData({ ...formData, tipo: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual"><div className="flex items-center gap-2"><Send className="w-4 h-4" />Envio Imediato</div></SelectItem>
                        <SelectItem value="agendada"><div className="flex items-center gap-2"><Clock className="w-4 h-4" />Agendado</div></SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.tipo === 'agendada' && (
                    <div className="space-y-2">
                      <Label>Data e hora</Label>
                      <Input type="datetime-local" value={formData.agendado_para}
                        onChange={e => setFormData({ ...formData, agendado_para: e.target.value })}
                        required />
                    </div>
                  )}
                </div>

                {/* Cadência */}
                <div className="space-y-3 border rounded-lg p-3 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">Cadência entre envios</Label>
                    <div className="flex gap-1 bg-muted rounded-md p-0.5">
                      <button type="button"
                        className={`px-2.5 py-1 text-xs rounded transition-colors ${formData.cadenciaMode === 'fixo' ? 'bg-background shadow-sm font-semibold' : 'text-muted-foreground hover:text-foreground'
                          }`}
                        onClick={() => setFormData({ ...formData, cadenciaMode: 'fixo' })}
                      >Fixo</button>
                      <button type="button"
                        className={`px-2.5 py-1 text-xs rounded transition-colors ${formData.cadenciaMode === 'variavel' ? 'bg-background shadow-sm font-semibold' : 'text-muted-foreground hover:text-foreground'
                          }`}
                        onClick={() => setFormData({ ...formData, cadenciaMode: 'variavel' })}
                      >Variável</button>
                    </div>
                  </div>

                  {formData.cadenciaMode === 'fixo' ? (
                    <>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-6">1s</span>
                        <Slider
                          value={[formData.cadencia]}
                          onValueChange={([v]) => setFormData({ ...formData, cadencia: v })}
                          min={1} max={60} step={1} className="flex-1"
                        />
                        <span className="text-xs text-muted-foreground w-8">60s</span>
                        <Badge variant="outline" className="font-mono min-w-[3rem] justify-center">{formData.cadencia}s</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Intervalo fixo de <strong>{formData.cadencia}s</strong> entre cada envio.
                        {formData.selectedIds.length > 0 && (
                          <span> Tempo estimado: <strong>{Math.ceil(formData.selectedIds.length * formData.cadencia / 60)} min</strong></span>
                        )}
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground w-12">Mínimo</span>
                          <Slider
                            value={[formData.cadenciaMin]}
                            onValueChange={([v]) => setFormData({ ...formData, cadenciaMin: Math.min(v, formData.cadenciaMax - 1) })}
                            min={1} max={59} step={1} className="flex-1"
                          />
                          <Badge variant="outline" className="font-mono min-w-[3rem] justify-center">{formData.cadenciaMin}s</Badge>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground w-12">Máximo</span>
                          <Slider
                            value={[formData.cadenciaMax]}
                            onValueChange={([v]) => setFormData({ ...formData, cadenciaMax: Math.max(v, formData.cadenciaMin + 1) })}
                            min={2} max={60} step={1} className="flex-1"
                          />
                          <Badge variant="outline" className="font-mono min-w-[3rem] justify-center">{formData.cadenciaMax}s</Badge>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Intervalo <strong>aleatório entre {formData.cadenciaMin}s e {formData.cadenciaMax}s</strong> para simular envio humano.
                        {formData.selectedIds.length > 0 && (
                          <span> Tempo estimado: <strong>{Math.ceil(formData.selectedIds.length * ((formData.cadenciaMin + formData.cadenciaMax) / 2) / 60)} min</strong></span>
                        )}
                      </p>
                    </>
                  )}
                </div>

                {/* Message with template selector */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Mensagem *</Label>
                    {templates.length > 0 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button type="button" variant="ghost" size="sm"><FileText className="w-3.5 h-3.5 mr-1" />Usar template</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64">
                          {templates.map(t => (
                            <DropdownMenuItem key={t.id} onClick={() => useTemplate(t)}>
                              <div className="truncate">
                                <span className="font-medium">{t.nome}</span>
                                <p className="text-xs text-muted-foreground truncate">{t.mensagem.slice(0, 50)}...</p>
                              </div>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  <Textarea value={formData.mensagem}
                    onChange={e => setFormData({ ...formData, mensagem: e.target.value })}
                    placeholder="Digite a mensagem... Use {nome} para personalizar"
                    rows={4} required />
                  <p className="text-xs text-muted-foreground">Use <code>{'{nome}'}</code> para incluir o nome do destinatário</p>
                </div>

                {/* Recipients */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Destinatários ({formData.selectedIds.length})</Label>
                    <div className="flex gap-1">
                      <Button type="button" variant="ghost" size="sm" onClick={selectAll}>Todos</Button>
                      <Button type="button" variant="ghost" size="sm" onClick={deselectAll}>Limpar</Button>
                    </div>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Buscar..." value={searchDest} onChange={e => setSearchDest(e.target.value)} className="pl-10" />
                  </div>
                  <ScrollArea className="h-48 border rounded-lg p-2">
                    {filteredDest.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Nenhum contato com telefone</p>
                    ) : filteredDest.map(d => {
                      const isSelected = formData.selectedIds.includes(d.id);
                      return (
                        <div key={d.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer" onClick={() => toggleDest(d.id)}>
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-primary border-primary' : 'border-muted-foreground/40'
                            }`}>
                            {isSelected && <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{d.nome}</p>
                            <p className="text-xs text-muted-foreground">{d.telefone}</p>
                          </div>
                          <Badge variant="outline" className={`text-[10px] ${d.tipo === 'lider' ? 'bg-blue-500/10 text-blue-600' : 'bg-green-500/10 text-green-600'}`}>
                            {d.tipo === 'lider' ? 'Líder' : 'Jovem'}
                          </Badge>
                        </div>
                      );
                    })}
                  </ScrollArea>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit" variant="hero" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : formData.tipo === 'agendada' ? 'Agendar' : 'Enviar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* API Status + Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Total</p>
              <MessageCircle className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold mt-1">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Enviadas</p>
              <CheckCircle className="w-4 h-4 text-success" />
            </div>
            <p className="text-2xl font-bold mt-1 text-success">{stats.enviadas}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Pendentes</p>
              <Clock className="w-4 h-4 text-warning" />
            </div>
            <p className="text-2xl font-bold mt-1 text-warning">{stats.pendentes}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Falhas</p>
              <XCircle className="w-4 h-4 text-destructive" />
            </div>
            <p className="text-2xl font-bold mt-1 text-destructive">{stats.falhas}</p>
          </CardContent>
        </Card>
      </div>

      {/* API warning */}
      {!apiConfigured && (
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="flex items-center gap-4 py-4">
            <Zap className="w-5 h-5 text-warning shrink-0" />
            <div>
              <p className="font-medium text-warning">Evolution API não configurada</p>
              <p className="text-sm text-muted-foreground">
                Acesse Configurações {'>'} APIs e adicione a URL, API Key e nome da instância para enviar mensagens automaticamente.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Messages List */}
      <Tabs defaultValue="todas">
        <TabsList>
          <TabsTrigger value="todas">Todas</TabsTrigger>
          <TabsTrigger value="pendentes">Pendentes</TabsTrigger>
          <TabsTrigger value="agendadas">Agendadas</TabsTrigger>
          <TabsTrigger value="enviadas">Enviadas</TabsTrigger>
          <TabsTrigger value="falhas">Falhas</TabsTrigger>
        </TabsList>

        {(['todas', 'pendentes', 'agendadas', 'enviadas', 'falhas'] as const).map(tab => {
          const filtered = tab === 'todas' ? mensagens
            : tab === 'pendentes' ? mensagens.filter(m => m.status === 'pendente' && m.tipo === 'manual')
              : tab === 'agendadas' ? mensagens.filter(m => m.tipo === 'agendada')
                : tab === 'enviadas' ? mensagens.filter(m => m.status === 'enviado')
                  : mensagens.filter(m => m.status === 'falha');

          return (
            <TabsContent key={tab} value={tab} className="mt-4">
              {loading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
              ) : filtered.length === 0 ? (
                <Card className="glass-card">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <MessageCircle className="w-12 h-12 text-muted-foreground/50 mb-4" />
                    <h3 className="font-semibold">Nenhuma mensagem</h3>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {filtered.map(msg => (
                    <Card key={msg.id} className="glass-card hover:shadow-md transition-shadow cursor-pointer" onClick={() => openMessageDetail(msg)}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-success/10">
                              <MessageCircle className="w-5 h-5 text-success" />
                            </div>
                            <div>
                              <CardTitle className="text-base font-medium">
                                {(msg.destinatarios as string[])?.length || 0} destinatário(s)
                              </CardTitle>
                              <CardDescription>
                                {format(parseISO(msg.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(msg.status)}
                            {msg.status === 'falha' && apiConfigured && (
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); retrySend(msg); }} title="Reenviar">
                                <RefreshCw className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-2">{msg.mensagem}</p>
                        {msg.tipo === 'agendada' && msg.agendado_para && (
                          <div className="flex items-center gap-2 mt-2 text-sm text-blue-600">
                            <Calendar className="w-4 h-4" />
                            Agendado para {format(parseISO(msg.agendado_para), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </div>
                        )}
                        {msg.erro && (
                          <p className="text-xs text-destructive mt-2 bg-destructive/5 p-2 rounded">{msg.erro}</p>
                        )}
                        {/* Botões de ação para agendadas */}
                        {msg.tipo === 'agendada' && msg.status === 'pendente' && (
                          <div className="flex gap-2 mt-3 pt-2 border-t">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              onClick={(e) => { e.stopPropagation(); sendScheduledNow(msg); }}
                            >
                              <Play className="w-3 h-3 mr-1" /> Enviar Agora
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-xs text-destructive hover:text-destructive"
                              onClick={(e) => { e.stopPropagation(); cancelScheduled(msg); }}
                            >
                              <Ban className="w-3 h-3 mr-1" /> Cancelar
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      {/* ══ Message Detail Modal ══ */}
      <Dialog open={!!selectedMsg} onOpenChange={(open) => !open && setSelectedMsg(null)}>
        <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              Detalhes da Mensagem
            </DialogTitle>
            <DialogDescription>
              {selectedMsg && format(parseISO(selectedMsg.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </DialogDescription>
          </DialogHeader>

          {selectedMsg && (
            <div className="space-y-5 py-2">
              {/* Status + Remetente */}
              <div className="flex items-center justify-between">
                {getStatusBadge(selectedMsg.status)}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span>Enviado por: <strong className="text-foreground">{senderName}</strong></span>
                </div>
              </div>

              {/* Mensagem */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Mensagem</Label>
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <p className="text-sm whitespace-pre-wrap">{selectedMsg.mensagem}</p>
                </div>
              </div>

              {/* Destinatários */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Destinatários ({recipientNames.length})
                </Label>
                <ScrollArea className="max-h-48 border rounded-lg">
                  <div className="p-2 space-y-1">
                    {recipientNames.length === 0 ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        <span className="text-sm text-muted-foreground">Carregando...</span>
                      </div>
                    ) : (
                      recipientNames.map((r, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                          <div className="p-1.5 rounded-full bg-primary/10">
                            <User className="w-3 h-3 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{r.name}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Phone className="w-3 h-3" />{r.phone}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Info adicional */}
              {selectedMsg.enviado_em && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-success" />
                  Enviado em {format(parseISO(selectedMsg.enviado_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              )}
              {selectedMsg.erro && (
                <div className="bg-destructive/5 border border-destructive/20 p-3 rounded-lg">
                  <p className="text-xs font-medium text-destructive mb-1">Erros:</p>
                  <p className="text-xs text-destructive/80">{selectedMsg.erro}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ══ Templates Sheet ══ */}
      <Sheet open={isTemplateSheetOpen} onOpenChange={setIsTemplateSheetOpen}>
        <SheetContent className="sm:max-w-[500px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-display flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />Templates de Mensagem
            </SheetTitle>
            <SheetDescription>Crie e gerencie templates reutilizáveis</SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {/* Template form */}
            <div className="border rounded-lg p-4 bg-muted/20 space-y-3">
              <h4 className="text-sm font-semibold">{editingTemplate ? 'Editar Template' : 'Novo Template'}</h4>
              <Input placeholder="Nome do template" value={templateForm.nome} onChange={e => setTemplateForm({ ...templateForm, nome: e.target.value })} />
              <Select value={templateForm.categoria} onValueChange={v => setTemplateForm({ ...templateForm, categoria: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="geral">Geral</SelectItem>
                  <SelectItem value="boas-vindas">Boas-vindas</SelectItem>
                  <SelectItem value="eventos">Eventos</SelectItem>
                  <SelectItem value="aniversario">Aniversário</SelectItem>
                  <SelectItem value="convite">Convite</SelectItem>
                </SelectContent>
              </Select>
              <Textarea placeholder="Mensagem do template... Use {nome} para personalizar" value={templateForm.mensagem} onChange={e => setTemplateForm({ ...templateForm, mensagem: e.target.value })} rows={3} />
              <div className="flex gap-2">
                <Button size="sm" variant="hero" onClick={saveTemplate} disabled={!templateForm.nome || !templateForm.mensagem}>
                  {editingTemplate ? 'Atualizar' : 'Criar'}
                </Button>
                {editingTemplate && (
                  <Button size="sm" variant="outline" onClick={() => { setEditingTemplate(null); setTemplateForm({ nome: '', mensagem: '', categoria: 'geral' }); }}>
                    Cancelar
                  </Button>
                )}
              </div>
            </div>

            {/* Template list */}
            {templates.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum template criado</p>
            ) : (
              templates.map(t => (
                <Card key={t.id} className="glass-card">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium">{t.nome}</p>
                        <Badge variant="outline" className="text-[10px] mt-1">{t.categoria}</Badge>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditingTemplate(t); setTemplateForm({ nome: t.nome, mensagem: t.mensagem, categoria: t.categoria }); }}>
                            <Edit className="w-4 h-4 mr-2" />Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => deleteTemplate(t.id)}>
                            <Trash2 className="w-4 h-4 mr-2" />Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <p className="text-sm text-muted-foreground">{t.mensagem}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
