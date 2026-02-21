import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import {
  Plus,
  Calendar,
  Clock,
  Loader2,
  MoreHorizontal,
  Trash2,
  Edit,
  ChevronDown,
  Repeat,
  Power,
  PowerOff,
  Palette,
  Tag,
  X,
  ClipboardList,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import EventoDetailModal from '@/features/eventos/components/EventoDetailModal';
import InscricoesTab from '@/features/eventos/components/InscricoesTab';
import EventoCalendar from '@/features/eventos/components/EventoCalendar';
import EventoFormDialog from '@/features/eventos/components/EventoFormDialog';
import RecorrenteFormDialog from '@/features/eventos/components/RecorrenteFormDialog';
import {
  type RecorrenciaConfig as RecorrenciaConfigType,
  generateRecurringDates,
  describeRecurrence,
} from '@/features/eventos/utils/recurrence-utils';
import { Evento, EventoRecorrente, TipoEvento, Grupo, Campanha } from '@/types/app-types';

const DEFAULT_COLOR = '#D4A017';

export default function Eventos() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [recorrentes, setRecorrentes] = useState<EventoRecorrente[]>([]);
  const [tiposEvento, setTiposEvento] = useState<TipoEvento[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('calendario');

  // Evento único dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingEvento, setEditingEvento] = useState<Evento | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Recorrente dialog
  const [isRecDialogOpen, setIsRecDialogOpen] = useState(false);
  const [isRecSubmitting, setIsRecSubmitting] = useState(false);
  const [deleteRecId, setDeleteRecId] = useState<string | null>(null);

  // Tipo de evento
  const [isTipoDialogOpen, setIsTipoDialogOpen] = useState(false);
  const [editingTipo, setEditingTipo] = useState<TipoEvento | null>(null);
  const [tipoForm, setTipoForm] = useState({ nome: '', cor: '#D4A017' });
  const [deleteTipoId, setDeleteTipoId] = useState<string | null>(null);
  const [tiposExpanded, setTiposExpanded] = useState(false);

  // Calendar
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvento, setSelectedEvento] = useState<Evento | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());

  // Evento form
  const [formData, setFormData] = useState({
    titulo: '', descricao: '', data_evento: '', hora_evento: '', tipo: '', grupo_id: '',
  });

  // Recorrente form
  const today = format(new Date(), 'yyyy-MM-dd');
  const [recFormData, setRecFormData] = useState({
    titulo: '', descricao: '', hora_evento: '19:00', tipo: '', grupo_id: '',
  });
  const [recConfig, setRecConfig] = useState<RecorrenciaConfigType>({
    tipo_recorrencia: 'SEMANAL', dia_semana: 5, data_inicio: today, data_fim: null,
  });

  useEffect(() => { fetchAll(); }, []);

  // Recarregar eventos ao mudar de mês
  useEffect(() => {
    fetchEventos(currentMonth);
  }, [currentMonth]);

  useEffect(() => {
    if (tiposEvento.length > 0 && activeFilters.size === 0) {
      setActiveFilters(new Set(tiposEvento.map(t => t.nome)));
    }
  }, [tiposEvento]);

  useEffect(() => {
    if (tiposEvento.length > 0) {
      const defaultTipo = tiposEvento[0].nome;
      if (!formData.tipo) setFormData(prev => ({ ...prev, tipo: defaultTipo }));
      if (!recFormData.tipo) setRecFormData(prev => ({ ...prev, tipo: defaultTipo }));
    }
  }, [tiposEvento]);

  function getCorByTipo(tipoNome: string): string {
    return tiposEvento.find(t => t.nome === tipoNome)?.cor || DEFAULT_COLOR;
  }

  // ── Data fetching ──

  async function fetchAll() {
    setLoading(true);
    await Promise.all([fetchEventos(currentMonth), fetchRecorrentes(), fetchTiposEvento(), fetchGrupos()]);
    setLoading(false);
  }

  async function fetchEventos(month: Date) {
    try {
      const inicioMes = startOfMonth(month).toISOString();
      const fimMes = endOfMonth(month).toISOString();
      const { data, error } = await supabase
        .from('eventos')
        .select('*, grupos(nome)')
        .gte('data_evento', inicioMes)
        .lte('data_evento', fimMes)
        .order('data_evento', { ascending: true });
      if (error) throw error;
      setEventos((data as any) || []);
    } catch (error) { console.error('Error fetching eventos:', error); toast.error('Erro ao carregar eventos'); }
  }

  async function fetchRecorrentes() {
    try {
      const { data, error } = await supabase.from('eventos_recorrentes').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setRecorrentes((data as any) || []);
    } catch (error) { console.error('Error fetching recorrentes:', error); }
  }

  async function fetchTiposEvento() {
    try {
      const { data, error } = await supabase.from('tipos_evento').select('*').order('nome');
      if (error) throw error;
      setTiposEvento((data as any) || []);
    } catch (error) { console.error('Error fetching tipos_evento:', error); }
  }

  async function fetchGrupos() {
    try {
      const { data, error } = await supabase.from('grupos').select('id, nome').eq('ativo', true).order('nome');
      if (error) throw error;
      setGrupos(data || []);
    } catch (error) { console.error('Error fetching grupos:', error); }
  }

  // ── Evento único handlers ──

  function resetForm() {
    const defaultTipo = tiposEvento.length > 0 ? tiposEvento[0].nome : '';
    setFormData({ titulo: '', descricao: '', data_evento: '', hora_evento: '', tipo: defaultTipo, grupo_id: '' });
    setEditingEvento(null);
  }

  function openEditDialog(evento: Evento) {
    setEditingEvento(evento);
    const parsedDate = parseISO(evento.data_evento);
    setFormData({
      titulo: evento.titulo, descricao: evento.descricao || '', data_evento: format(parsedDate, 'yyyy-MM-dd'),
      hora_evento: format(parsedDate, 'HH:mm'), tipo: evento.tipo, grupo_id: evento.grupo_id || '',
    });
    setIsDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const dataEvento = new Date(`${formData.data_evento}T${formData.hora_evento}`);
      const selectedTipo = tiposEvento.find(t => t.nome === formData.tipo);
      const payload: Database['public']['Tables']['eventos']['Insert'] = {
        titulo: formData.titulo,
        descricao: formData.descricao || null,
        data_evento: dataEvento.toISOString(),
        tipo: formData.tipo,
        tipo_id: selectedTipo?.id || null,
        grupo_id: formData.grupo_id || null,
        campanha_id: null,
      };
      if (editingEvento) {
        const { error } = await supabase.from('eventos').update(payload).eq('id', editingEvento.id);
        if (error) throw error;
        toast.success('Evento atualizado com sucesso!');
      } else {
        const { error } = await supabase.from('eventos').insert(payload);
        if (error) throw error;
        toast.success('Evento criado com sucesso!');
      }
      setIsDialogOpen(false);
      resetForm();
      fetchEventos(currentMonth);
    } catch (error) { console.error('Error saving evento:', error); toast.error('Erro ao salvar evento'); }
    finally { setIsSubmitting(false); }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      const { error } = await supabase.from('eventos').delete().eq('id', deleteId);
      if (error) throw error;
      toast.success('Evento excluído com sucesso');
      fetchEventos(currentMonth);
    } catch (error) { console.error('Error deleting evento:', error); toast.error('Erro ao excluir evento'); }
    finally { setDeleteId(null); }
  }

  // ── Recorrente handlers ──

  function resetRecForm() {
    const defaultTipo = tiposEvento.length > 0 ? tiposEvento[0].nome : '';
    setRecFormData({ titulo: '', descricao: '', hora_evento: '19:00', tipo: defaultTipo, grupo_id: '' });
    setRecConfig({ tipo_recorrencia: 'SEMANAL', dia_semana: 5, data_inicio: today, data_fim: null });
  }

  async function handleRecSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsRecSubmitting(true);
    try {
      const selectedTipo = tiposEvento.find(t => t.nome === recFormData.tipo);
      const rulePayload: Database['public']['Tables']['eventos_recorrentes']['Insert'] = {
        titulo: recFormData.titulo,
        descricao: recFormData.descricao || null,
        tipo: recFormData.tipo,
        tipo_id: selectedTipo?.id || null,
        grupo_id: recFormData.grupo_id || null,
        campanha_id: null,
        hora_evento: recFormData.hora_evento,
        tipo_recorrencia: recConfig.tipo_recorrencia,
        dia_semana: recConfig.dia_semana ?? null,
        intervalo_dias: recConfig.intervalo_dias ?? null,
        posicao_no_mes: recConfig.posicao_no_mes ?? null,
        dia_do_mes: recConfig.dia_do_mes ?? null,
        data_inicio: recConfig.data_inicio,
        data_fim: recConfig.data_fim || null,
      };
      const { data: ruleData, error: ruleError } = await supabase.from('eventos_recorrentes').insert(rulePayload).select('id').single();
      if (ruleError) throw ruleError;
      const dates = generateRecurringDates(recConfig);
      if (dates.length === 0) {
        toast.warning('Nenhum evento foi gerado com esta configuração.');
        setIsRecDialogOpen(false); resetRecForm(); fetchRecorrentes(); return;
      }
      const [hours, minutes] = recFormData.hora_evento.split(':').map(Number);
      const eventPayloads = dates.map(date => {
        const eventDate = new Date(date); eventDate.setHours(hours, minutes, 0, 0);
        return {
          titulo: recFormData.titulo,
          descricao: recFormData.descricao || null,
          data_evento: eventDate.toISOString(),
          tipo: recFormData.tipo,
          tipo_id: selectedTipo?.id || null,
          grupo_id: recFormData.grupo_id || null,
          campanha_id: null,
          recorrente_id: ruleData.id
        };
      });
      const { error: eventsError } = await supabase.from('eventos').insert(eventPayloads);
      if (eventsError) throw eventsError;
      toast.success(`${dates.length} eventos criados com sucesso!`);
      setIsRecDialogOpen(false); resetRecForm(); fetchEventos(currentMonth); fetchRecorrentes();
    } catch (error) { console.error('Error creating recurring events:', error); toast.error('Erro ao criar eventos recorrentes'); }
    finally { setIsRecSubmitting(false); }
  }

  async function handleDeleteRecorrente() {
    if (!deleteRecId) return;
    try {
      const { error } = await supabase.from('eventos_recorrentes').delete().eq('id', deleteRecId);
      if (error) throw error;
      toast.success('Regra e eventos excluídos com sucesso');
      fetchRecorrentes(); fetchEventos(currentMonth);
    } catch (error) { console.error('Error deleting recorrente:', error); toast.error('Erro ao excluir regra'); }
    finally { setDeleteRecId(null); }
  }

  async function toggleRecorrenteAtivo(rec: EventoRecorrente) {
    try {
      if (rec.ativo) {
        const now = new Date().toISOString();
        const { error: deleteError } = await supabase.from('eventos').delete().eq('recorrente_id', rec.id).gte('data_evento', now);
        if (deleteError) throw deleteError;
        const { error } = await supabase.from('eventos_recorrentes').update({ ativo: false }).eq('id', rec.id);
        if (error) throw error;
        toast.success('Regra desativada — eventos futuros removidos');
      } else {
        const { error } = await supabase.from('eventos_recorrentes').update({ ativo: true }).eq('id', rec.id);
        if (error) throw error;
        const configForGeneration: RecorrenciaConfigType = {
          tipo_recorrencia: rec.tipo_recorrencia as RecorrenciaConfigType['tipo_recorrencia'],
          dia_semana: rec.dia_semana ?? undefined, intervalo_dias: rec.intervalo_dias ?? undefined,
          posicao_no_mes: rec.posicao_no_mes ?? undefined, dia_do_mes: rec.dia_do_mes ?? undefined,
          data_inicio: format(new Date(), 'yyyy-MM-dd'), data_fim: rec.data_fim,
        };
        const dates = generateRecurringDates(configForGeneration);
        if (dates.length > 0) {
          const [hours, mins] = rec.hora_evento.substring(0, 5).split(':').map(Number);
          const payloads = dates.map(date => {
            const d = new Date(date); d.setHours(hours, mins, 0, 0);
            return { titulo: rec.titulo, descricao: rec.descricao || null, data_evento: d.toISOString(), tipo: rec.tipo, grupo_id: rec.grupo_id || null, campanha_id: null, recorrente_id: rec.id };
          });
          const { error: ie } = await supabase.from('eventos').insert(payloads);
          if (ie) throw ie;
        }
        toast.success(`Regra ativada — ${dates.length} eventos criados`);
      }
      fetchRecorrentes(); fetchEventos(currentMonth);
    } catch (error) { console.error('Error toggling recorrente:', error); toast.error('Erro ao alterar status'); }
  }

  // ── Tipo de evento handlers ──

  function resetTipoForm() { setTipoForm({ nome: '', cor: '#D4A017' }); setEditingTipo(null); }

  function openEditTipo(tipo: TipoEvento) {
    setEditingTipo(tipo); setTipoForm({ nome: tipo.nome, cor: tipo.cor }); setIsTipoDialogOpen(true);
  }

  async function handleTipoSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingTipo) {
        const oldName = editingTipo.nome;
        const { error } = await supabase.from('tipos_evento').update({ nome: tipoForm.nome, cor: tipoForm.cor }).eq('id', editingTipo.id);
        if (error) throw error;
        if (oldName !== tipoForm.nome) {
          await supabase.from('eventos').update({ tipo: tipoForm.nome }).eq('tipo', oldName);
          await supabase.from('eventos_recorrentes').update({ tipo: tipoForm.nome }).eq('tipo', oldName);
        }
        toast.success('Tipo atualizado!');
      } else {
        const { error } = await supabase.from('tipos_evento').insert({ nome: tipoForm.nome, cor: tipoForm.cor });
        if (error) throw error;
        toast.success('Tipo criado!');
      }
      setIsTipoDialogOpen(false); resetTipoForm(); fetchTiposEvento(); fetchEventos(currentMonth);
    } catch (error: any) {
      if (error?.code === '23505') toast.error('Já existe um tipo com este nome');
      else toast.error('Erro ao salvar tipo');
    }
  }

  async function handleDeleteTipo() {
    if (!deleteTipoId) return;
    try {
      const { error } = await supabase.from('tipos_evento').delete().eq('id', deleteTipoId);
      if (error) throw error;
      toast.success('Tipo excluído'); fetchTiposEvento();
    } catch (error) { toast.error('Erro ao excluir tipo. Verifique se não há eventos vinculados.'); }
    finally { setDeleteTipoId(null); }
  }

  // ── Calendar helpers ──

  function toggleFilter(tipo: string) {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(tipo)) { if (next.size > 1) next.delete(tipo); } else { next.add(tipo); }
      return next;
    });
  }

  // ══════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Eventos</h1>
          <p className="text-muted-foreground mt-1">Gerencie eventos, cultos e recorrências do ministério</p>
        </div>
        <div className="flex gap-2">
          <RecorrenteFormDialog
            open={isRecDialogOpen}
            onOpenChange={setIsRecDialogOpen}
            formData={recFormData}
            onFormChange={setRecFormData}
            recConfig={recConfig}
            onRecConfigChange={setRecConfig}
            tiposEvento={tiposEvento}
            grupos={grupos}
            isSubmitting={isRecSubmitting}
            onSubmit={handleRecSubmit}
            onReset={resetRecForm}
          />
          <EventoFormDialog
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            formData={formData}
            onFormChange={setFormData}
            tiposEvento={tiposEvento}
            grupos={grupos}
            isEditing={!!editingEvento}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            onReset={resetForm}
          />
        </div>
      </div>

      {/* Alert Dialogs */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Evento</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir este evento? As presenças registradas também serão removidas.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteRecId} onOpenChange={(open) => !open && setDeleteRecId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Regra Recorrente</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza? <strong>Todos os eventos gerados</strong> e presenças registradas serão excluídos.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRecorrente} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir Tudo</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteTipoId} onOpenChange={(open) => !open && setDeleteTipoId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Tipo de Evento</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza? Eventos existentes com este tipo não serão excluídos, mas ficarão sem tipo definido.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTipo} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Tipo Dialog */}
      <Dialog open={isTipoDialogOpen} onOpenChange={(open) => { setIsTipoDialogOpen(open); if (!open) resetTipoForm(); }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Tag className="w-5 h-5 text-primary" />
              {editingTipo ? 'Editar Tipo' : 'Novo Tipo de Evento'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleTipoSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input value={tipoForm.nome} onChange={(e) => setTipoForm({ ...tipoForm, nome: e.target.value })} placeholder="Ex: Vigília" required />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Palette className="w-4 h-4" /> Cor</Label>
              <div className="flex items-center gap-3">
                <input type="color" value={tipoForm.cor} onChange={(e) => setTipoForm({ ...tipoForm, cor: e.target.value })}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-border" />
                <Input value={tipoForm.cor} onChange={(e) => setTipoForm({ ...tipoForm, cor: e.target.value })} className="flex-1 font-mono" />
                <Badge style={{ backgroundColor: tipoForm.cor, color: '#fff' }} className="text-sm px-3">{tipoForm.nome || 'Preview'}</Badge>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => { setIsTipoDialogOpen(false); resetTipoForm(); }}>Cancelar</Button>
              <Button type="submit" variant="hero">{editingTipo ? 'Atualizar' : 'Criar Tipo'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="calendario" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Calendário
          </TabsTrigger>
          <TabsTrigger value="recorrencias" className="flex items-center gap-2">
            <Repeat className="w-4 h-4" /> Recorrências
            {recorrentes.length > 0 && <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">{recorrentes.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="inscricoes" className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4" /> Inscrições
          </TabsTrigger>
        </TabsList>

        {/* TAB: CALENDÁRIO */}
        <TabsContent value="calendario" className="mt-6">
          <EventoCalendar
            eventos={eventos}
            tiposEvento={tiposEvento}
            loading={loading}
            currentMonth={currentMonth}
            selectedDate={selectedDate}
            activeFilters={activeFilters}
            onMonthChange={setCurrentMonth}
            onDateSelect={setSelectedDate}
            onFilterToggle={toggleFilter}
            onEventView={(e) => { setSelectedEvento(e); setIsDetailModalOpen(true); }}
            onEventEdit={openEditDialog}
            onEventDelete={setDeleteId}
            getCorByTipo={getCorByTipo}
          />
        </TabsContent>

        {/* TAB: RECORRÊNCIAS */}
        <TabsContent value="recorrencias" className="mt-6 space-y-6">
          {/* Tipos de Evento - collapsible */}
          <Collapsible open={tiposExpanded} onOpenChange={setTiposExpanded}>
            <Card className="glass-card">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors rounded-t-xl">
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-display flex items-center gap-2 text-base">
                      <Tag className="w-5 h-5 text-primary" /> Tipos de Evento
                      <Badge variant="secondary" className="text-xs">{tiposEvento.length}</Badge>
                    </CardTitle>
                    <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${tiposExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {tiposEvento.map(tipo => (
                      <div key={tipo.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 group hover:bg-muted transition-colors">
                        <div className="w-4 h-4 rounded-full border-2 border-background shadow-sm" style={{ backgroundColor: tipo.cor }} />
                        <span className="text-sm font-medium">{tipo.nome}</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEditTipo(tipo)} className="p-0.5 rounded hover:bg-background/50"><Edit className="w-3 h-3 text-muted-foreground" /></button>
                          <button onClick={() => setDeleteTipoId(tipo.id)} className="p-0.5 rounded hover:bg-background/50"><X className="w-3 h-3 text-destructive" /></button>
                        </div>
                      </div>
                    ))}
                    <button onClick={() => setIsTipoDialogOpen(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-primary/30 text-primary hover:bg-primary/5 transition-colors text-sm">
                      <Plus className="w-4 h-4" /> Novo Tipo
                    </button>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Recorrências */}
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : recorrentes.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Repeat className="w-12 h-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-semibold text-foreground">Nenhuma recorrência configurada</h3>
                <p className="text-sm text-muted-foreground mt-1">Crie um evento recorrente para preencher o calendário automaticamente</p>
                <Button variant="hero" className="mt-4" onClick={() => setIsRecDialogOpen(true)}>
                  <Repeat className="w-4 h-4" /> Criar Evento Recorrente
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recorrentes.map((rec, index) => {
                const eventCount = eventos.filter(e => e.recorrente_id === rec.id).length;
                const recColor = getCorByTipo(rec.tipo);
                return (
                  <Card key={rec.id} className="glass-card animate-slide-up opacity-0 hover:shadow-lg transition-shadow"
                    style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl ${rec.ativo ? '' : 'bg-muted'}`} style={rec.ativo ? { backgroundColor: recColor + '20' } : undefined}>
                            <Repeat className="w-5 h-5" style={{ color: rec.ativo ? recColor : undefined }} />
                          </div>
                          <div>
                            <CardTitle className="text-base font-display">{rec.titulo}</CardTitle>
                            <div className="flex gap-2 mt-1 flex-wrap">
                              <Badge className="text-xs text-white" style={{ backgroundColor: recColor }}>{rec.tipo}</Badge>
                              <Badge variant={rec.ativo ? 'default' : 'secondary'} className={rec.ativo ? 'bg-success/10 text-success hover:bg-success/20' : ''}>
                                {rec.ativo ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => toggleRecorrenteAtivo(rec)}>
                              {rec.ativo ? <><PowerOff className="w-4 h-4 mr-2" /> Desativar</> : <><Power className="w-4 h-4 mr-2" /> Ativar</>}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteRecId(rec.id)}>
                              <Trash2 className="w-4 h-4 mr-2" /> Excluir Tudo
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Repeat className="w-3.5 h-3.5" />
                          <span>{describeRecurrence({
                            tipo_recorrencia: rec.tipo_recorrencia as RecorrenciaConfigType['tipo_recorrencia'],
                            dia_semana: rec.dia_semana ?? undefined, intervalo_dias: rec.intervalo_dias ?? undefined,
                            posicao_no_mes: rec.posicao_no_mes ?? undefined, dia_do_mes: rec.dia_do_mes ?? undefined,
                            data_inicio: rec.data_inicio, data_fim: rec.data_fim,
                          })}</span>
                        </div>
                        <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" /><span>{rec.hora_evento.substring(0, 5)}</span></div>
                        <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /><span>{eventCount} eventos no calendário</span></div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* TAB: INSCRIÇÕES */}
        <TabsContent value="inscricoes" className="mt-6">
          <InscricoesTab />
        </TabsContent>
      </Tabs>

      <EventoDetailModal evento={selectedEvento} open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen} />
    </div>
  );
}
