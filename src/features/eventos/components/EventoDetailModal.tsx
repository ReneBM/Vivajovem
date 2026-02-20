import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
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
} from 'lucide-react';
import { Evento } from '@/types/app-types';

interface Jovem {
  id: string;
  nome: string;
  foto_url: string | null;
}

interface Presenca {
  id: string;
  jovem_id: string;
  presente: boolean;
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
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    if (open && evento) {
      fetchJovensAndPresencas();
    }
  }, [open, evento]);

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
          <DialogTitle className="font-display text-xl">{evento.titulo}</DialogTitle>
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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info" className="gap-2">
              <Info className="w-4 h-4" />
              Informações
            </TabsTrigger>
            <TabsTrigger value="presenca" className="gap-2">
              <UserCheck className="w-4 h-4" />
              Presença
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-4 space-y-4">
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

          <TabsContent value="presenca" className="mt-4 flex-1 flex flex-col min-h-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar jovem..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-sm text-muted-foreground">
                    {filteredJovens.length} jovens encontrados
                  </span>
                  <Badge variant="outline" className="gap-1">
                    <Check className="w-3 h-3" />
                    {presentCount} presentes
                  </Badge>
                </div>

                {/* Jovens List */}
                <ScrollArea className="flex-1 -mx-6 px-6">
                  <div className="space-y-2 pb-4">
                    {filteredJovens.map((jovem) => {
                      const isPresent = presencas.get(jovem.id);
                      return (
                        <div
                          key={jovem.id}
                          className={`
                            flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all
                            ${isPresent ? 'bg-success/10 border border-success/30' : 'bg-muted/50 hover:bg-muted'}
                          `}
                          onClick={() => togglePresenca(jovem.id)}
                        >
                          <Checkbox
                            checked={isPresent || false}
                            onCheckedChange={() => togglePresenca(jovem.id)}
                          />
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={jovem.foto_url || undefined} />
                            <AvatarFallback className="text-xs bg-accent/10 text-accent">
                              {getInitials(jovem.nome)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="flex-1 font-medium text-sm">{jovem.nome}</span>
                          {isPresent && (
                            <Check className="w-4 h-4 text-success" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>

                {/* Save Button */}
                <div className="pt-4 border-t mt-auto">
                  <Button
                    onClick={savePresencas}
                    disabled={saving}
                    className="w-full"
                    variant="hero"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Salvar Presenças
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
