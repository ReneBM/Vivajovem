import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Loader2,
  Search,
  Check,
  X,
  Save,
  Info,
  UserCheck,
  ClipboardCopy,
  ExternalLink,
  FileText
} from 'lucide-react';
import { Evento } from '@/types/app-types';

interface Jovem {
  id: string;
  nome: string;
  foto_url: string | null;
}

interface InscriçãoEvento {
  id: string;
  slug: string;
  ativa: boolean;
  limite_vagas: number | null;
  total_inscritos?: number;
}

const eventTypeColors: Record<string, string> = {
  CULTO: 'bg-primary text-primary-foreground',
  REUNIAO: 'bg-blue-500 text-white',
  CAMPANHA: 'bg-amber-500 text-white',
  ESPECIAL: 'bg-green-500 text-white',
};

const eventTypeLabels: Record<string, string> = {
  CULTO: 'Culto',
  REUNIAO: 'Reunião',
  CAMPANHA: 'Campanha',
  ESPECIAL: 'Especial',
};

interface EventoDetailModalProps {
  evento: Evento | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EventoDetailModal({ evento, open, onOpenChange }: EventoDetailModalProps) {
  const [jovens, setJovens] = useState<Jovem[]>([]);
  const [presencas, setPresencas] = useState<Map<string, boolean>>(new Map());
  const [originalPresencas, setOriginalPresencas] = useState<Map<string, string>>(new Map()); // jovem_id -> presenca_id
  const [inscricao, setInscricao] = useState<InscriçãoEvento | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingInscricao, setLoadingInscricao] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    if (open && evento) {
      fetchJovensAndPresencas();
      fetchInscricao();
    }
  }, [open, evento]);

  async function fetchInscricao() {
    if (!evento) return;
    setLoadingInscricao(true);
    try {
      const { data, error } = await supabase
        .from('inscricoes_evento')
        .select('id, slug, ativa, limite_vagas')
        .eq('evento_id', evento.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // Count total participants for this registration form
        const { count, error: countError } = await supabase
          .from('inscricoes_evento_respostas')
          .select('*', { count: 'exact', head: true })
          .eq('inscricao_id', data.id);

        setInscricao({ ...data, total_inscritos: count || 0 });
      } else {
        setInscricao(null);
      }
    } catch (error) {
      console.error('Error fetching registration:', error);
    } finally {
      setLoadingInscricao(false);
    }
  }

  async function fetchJovensAndPresencas() {
    if (!evento) return;
    setLoading(true);

    try {
      // Fetch all active jovens
      const { data: jovensData, error: jovensError } = await supabase
        .from('jovens')
        .select('id, nome, foto_url')
        .eq('status', 'ATIVO')
        .order('nome');

      if (jovensError) throw jovensError;
      setJovens(jovensData || []);

      // Fetch existing presencas for this event
      const { data: presencasData, error: presencasError } = await supabase
        .from('presencas')
        .select('id, jovem_id, presente')
        .eq('evento_id', evento.id);

      if (presencasError) throw presencasError;

      const presencasMap = new Map<string, boolean>();
      const originalMap = new Map<string, string>();

      presencasData?.forEach((p) => {
        presencasMap.set(p.jovem_id, p.presente);
        originalMap.set(p.jovem_id, p.id);
      });

      setPresencas(presencasMap);
      setOriginalPresencas(originalMap);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(slug: string) {
    const url = `${window.location.origin}/inscricao/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copiado para a área de transferência!');
  }

  function togglePresenca(jovemId: string) {
    setPresencas(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(jovemId);
      if (current === undefined) {
        newMap.set(jovemId, true);
      } else {
        newMap.set(jovemId, !current);
      }
      return newMap;
    });
  }

  async function savePresencas() {
    if (!evento) return;
    setSaving(true);

    try {
      // Prepare updates, inserts, and deletes
      const updates: { id: string; presente: boolean }[] = [];
      const inserts: { evento_id: string; jovem_id: string; presente: boolean }[] = [];

      presencas.forEach((presente, jovemId) => {
        const existingId = originalPresencas.get(jovemId);
        if (existingId) {
          updates.push({ id: existingId, presente });
        } else {
          inserts.push({ evento_id: evento.id, jovem_id: jovemId, presente });
        }
      });

      // Perform updates
      for (const update of updates) {
        const { error } = await supabase
          .from('presencas')
          .update({ presente: update.presente })
          .eq('id', update.id);
        if (error) throw error;
      }

      // Perform inserts
      if (inserts.length > 0) {
        const { error } = await supabase.from('presencas').insert(inserts);
        if (error) throw error;
      }

      toast.success('Presenças salvas com sucesso!');
      fetchJovensAndPresencas(); // Refresh to get new IDs
    } catch (error) {
      console.error('Error saving presencas:', error);
      toast.error('Erro ao salvar presenças');
    } finally {
      setSaving(false);
    }
  }

  function getInitials(name: string) {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  const filteredJovens = jovens.filter((jovem) =>
    jovem.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const presentCount = Array.from(presencas.values()).filter(Boolean).length;

  if (!evento) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            <DialogTitle className="font-display text-xl">{evento.titulo}</DialogTitle>
            {inscricao && (
              <Badge variant="success" className="gap-1">
                <FileText className="w-3 h-3" />
                Inscrições Ativas
              </Badge>
            )}
          </div>
          <DialogDescription className="flex items-center gap-2">
            <Badge className={eventTypeColors[evento.tipo]}>
              {eventTypeLabels[evento.tipo]}
            </Badge>
            {evento.grupos && (
              <Badge variant="outline">{evento.grupos.nome}</Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info" className="gap-2">
              <Info className="w-4 h-4" />
              Informações
            </TabsTrigger>
            <TabsTrigger value="presenca" className="gap-2">
              <UserCheck className="w-4 h-4" />
              Presença
            </TabsTrigger>
            <TabsTrigger value="inscricao" className="gap-2">
              <FileText className="w-4 h-4" />
              Inscrição
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-4 space-y-4 overflow-y-auto">
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Data</p>
                  <p className="font-medium">
                    {format(parseISO(evento.data_evento), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Clock className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Horário</p>
                  <p className="font-medium">
                    {format(parseISO(evento.data_evento), "HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>

              {evento.descricao && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">Descrição</p>
                  <p className="text-sm">{evento.descricao}</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="inscricao" className="mt-4 flex-1 flex flex-col min-h-0">
            {loadingInscricao ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : inscricao ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-success/30 bg-success/5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-success flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        Página de Inscrição Ativa
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Participantes podem se inscrever publicamente para este evento.
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-background">
                      {inscricao.total_inscritos} / {inscricao.limite_vagas || '∞'}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Link Público</Label>
                    <div className="flex gap-2">
                      <Input
                        readOnly
                        value={`${window.location.origin}/inscricao/${inscricao.slug}`}
                        className="bg-background/50 text-xs h-8"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => copyToClipboard(inscricao.slug)}
                      >
                        <ClipboardCopy className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        asChild
                      >
                        <a href={`/inscricao/${inscricao.slug}`} target="_blank" rel="noreferrer">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                    <p className="text-[10px] uppercase text-muted-foreground mb-1">Total de Inscritos</p>
                    <p className="text-xl font-bold">{inscricao.total_inscritos}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                    <p className="text-[10px] uppercase text-muted-foreground mb-1">Vagas Restantes</p>
                    <p className="text-xl font-bold">
                      {inscricao.limite_vagas ? Math.max(0, inscricao.limite_vagas - (inscricao.total_inscritos || 0)) : 'Ilimitado'}
                    </p>
                  </div>
                </div>

                <Button variant="outline" className="w-full gap-2" asChild>
                  <a href="/eventos?tab=inscricoes">
                    <Users className="w-4 h-4" />
                    Gerenciar Participantes
                  </a>
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="max-w-[280px]">
                  <h3 className="font-semibold">Nenhuma inscrição ativa</h3>
                  <p className="text-sm text-muted-foreground">
                    Você ainda não criou um formulário de inscrição para este evento.
                  </p>
                </div>
                <Button variant="hero" asChild>
                  <a href="/eventos?tab=inscricoes">
                    Criar Formulário
                  </a>
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
