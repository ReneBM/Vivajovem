
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';
import StatCard from "@/features/dashboard/components/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users,
  UserCheck,
  Calendar,
  TrendingUp,
  UserX,
  Megaphone,
  ArrowRight,
  Plus,
  Loader2,
  Heart,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalJovens: 0,
    totalLideres: 0,
    campanhasAtivas: 0,
    novosEsteMes: 0,
  });
  const [ranking, setRanking] = useState<{ id: string; nome: string; presencas: number }[]>([]);
  const [growthData, setGrowthData] = useState<{ month: string; novos: number }[]>([]);
  const [ausentes, setAusentes] = useState<{ id: string; nome: string; telefone: string | null; dias: number }[]>([]);
  const [aniversariantes, setAniversariantes] = useState<{ id: string; nome: string; data: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [proximoEvento, setProximoEvento] = useState<{ titulo: string; data: string } | null>(null);
  const [userName, setUserName] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    async function fetchStats() {
      try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        const [jovensResult, lideresResult, campanhasResult, proximoEventoResult, novosResult] = await Promise.all([
          supabase.from('jovens').select('id', { count: 'exact' }).eq('status', 'ATIVO'),
          supabase.from('lideres').select('id', { count: 'exact' }).eq('status', 'ATIVO'),
          supabase.from('campanhas').select('id', { count: 'exact' }).eq('ativa', true),
          supabase.from('eventos').select('titulo, data_evento').gte('data_evento', now.toISOString()).order('data_evento').limit(1),
          supabase.from('jovens').select('id', { count: 'exact' }).gte('created_at', startOfMonth),
        ]);

        setStats({
          totalJovens: jovensResult.count || 0,
          totalLideres: lideresResult.count || 0,
          campanhasAtivas: campanhasResult.count || 0,
          novosEsteMes: novosResult.count || 0,
        });

        if (proximoEventoResult.data?.[0]) {
          const evento = proximoEventoResult.data[0];
          setProximoEvento({
            titulo: evento.titulo,
            data: new Date(evento.data_evento).toLocaleDateString('pt-BR', { weekday: 'long', hour: '2-digit', minute: '2-digit' }),
          });
        }

        // 1. Crescimento (Últimos 6 meses)
        const { data: jovensData } = await supabase.from('jovens').select('created_at');
        if (jovensData) {
          const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
          const monthCounts: Record<string, number> = {};

          jovensData.forEach((j) => {
            const date = new Date(j.created_at);
            const monthKey = months[date.getMonth()];
            monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
          });

          const last6 = [];
          for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const m = months[d.getMonth()];
            last6.push({ month: m, novos: monthCounts[m] || 0 });
          }
          setGrowthData(last6);
        }

        // 2. Ranking de Frequência (Top 5 jovens com mais presenças)
        const { data: presencasRanking } = await supabase
          .from('presencas')
          .select('jovem_id, jovens(nome)')
          .eq('presente', true);

        if (presencasRanking) {
          const counts: Record<string, { nome: string; count: number }> = {};
          presencasRanking.forEach(p => {
            if (p.jovem_id) {
              const nome = (p.jovens as any)?.nome || 'Jovem';
              if (!counts[p.jovem_id]) {
                counts[p.jovem_id] = { nome, count: 0 };
              }
              counts[p.jovem_id].count++;
            }
          });

          const sortedRanking = Object.entries(counts)
            .map(([id, data]) => ({ id, nome: data.nome, presencas: data.count }))
            .sort((a, b) => b.presencas - a.presencas)
            .slice(0, 5);

          setRanking(sortedRanking);
        }

        // 2.1 Buscar últimos eventos para identificar ausentes
        const { data: ultimosEventos } = await supabase
          .from('eventos')
          .select('id, data_evento')
          .lt('data_evento', now.toISOString())
          .order('data_evento', { ascending: false })
          .limit(6);

        // 3. Jovens Ausentes (Não presentes nos últimos 3 eventos)
        if (ultimosEventos && ultimosEventos.length >= 3) {
          const top3Ids = ultimosEventos.slice(0, 3).map(e => e.id);
          const { data: presencasRecentes } = await supabase
            .from('presencas')
            .select('jovem_id, evento_id')
            .in('evento_id', top3Ids)
            .eq('presente', true);

          if (presencasRecentes) {
            const presentJovensIds = new Set(presencasRecentes.map(p => p.jovem_id));
            const { data: todosJovens } = await supabase.from('jovens').select('id, nome, telefone').eq('status', 'ATIVO');

            if (todosJovens) {
              const ausentesList = todosJovens
                .filter(j => !presentJovensIds.has(j.id))
                .slice(0, 3)
                .map(j => ({ id: j.id, nome: j.nome, telefone: j.telefone, dias: 21 })); // Estimativa simples
              setAusentes(ausentesList);
            }
          }
        }

        // 4. Aniversariantes do Mês
        const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0');
        const { data: niverData } = await supabase
          .from('jovens')
          .select('id, nome, data_nascimento')
          .filter('data_nascimento', 'cs', `-${currentMonth}-`)
          .limit(5);

        if (niverData) {
          setAniversariantes(niverData.map(n => ({
            id: n.id,
            nome: n.nome,
            data: n.data_nascimento ? new Date(n.data_nascimento).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '—'
          })));
        }

      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  useEffect(() => {
    async function fetchUserName() {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('nome')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data?.nome) setUserName(data.nome);
    }
    fetchUserName();
  }, [user]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            {userName ? `Seja bem-vindo, ${userName.split(' ')[0]}!` : 'Dashboard'}
          </h1>
          <p className="text-muted-foreground mt-1">Visão geral do seu ministério</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link to="/jovens-visitantes">
              <Plus className="w-4 h-4 mr-2" />
              Visitantes
            </Link>
          </Button>
          <Button variant="hero" asChild>
            <Link to="/jovens/novo">
              <Plus className="w-4 h-4" />
              Novo jovem
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Total de Jovens"
              value={stats.totalJovens}
              change={`+${stats.novosEsteMes} novos este mês`}
              changeType="positive"
              icon={Users}
              iconColor="bg-primary/10 text-primary"
              delay={0}
            />
            <StatCard
              title="Líderes Ativos"
              value={stats.totalLideres}
              change="Equipe completa"
              changeType="neutral"
              icon={UserCheck}
              iconColor="bg-success/10 text-success"
              delay={100}
            />
            <StatCard
              title="Campanhas Ativas"
              value={stats.campanhasAtivas}
              change="Foco no crescimento"
              changeType="neutral"
              icon={Megaphone}
              iconColor="bg-accent/10 text-accent"
              delay={200}
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 gap-6">
            {/* Growth Chart */}
            <Card className="glass-card animate-slide-up opacity-0" style={{ animationDelay: '500ms', animationFillMode: 'forwards' }}>
              <CardHeader>
                <CardTitle className="font-display">Crescimento Mensal</CardTitle>
                <CardDescription>Novos jovens cadastrados nos últimos 6 meses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={growthData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar
                        dataKey="novos"
                        fill="hsl(var(--accent))"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions & Alertas */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Jovens Mais Frequentes (RANKING) */}
            <Card className="glass-card animate-slide-up opacity-0 lg:col-span-1 border-primary/20" style={{ animationDelay: '600ms', animationFillMode: 'forwards' }}>
              <CardHeader className="pb-3 text-primary">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  <CardTitle className="text-lg font-display">Ranking de Presença</CardTitle>
                </div>
                <CardDescription>Jovens mais engajados</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {ranking.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Nenhum dado de presença disponível.</p>
                ) : (
                  ranking.map((j, index) => (
                    <div key={j.id} className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/10 transition-transform hover:scale-[1.02]">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">
                          {index + 1}º
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{j.nome}</p>
                          <p className="text-[10px] text-muted-foreground">{j.presencas} presenças registradas</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Jovens Ausentes */}
            <Card className="glass-card animate-slide-up opacity-0 lg:col-span-1" style={{ animationDelay: '700ms', animationFillMode: 'forwards' }}>
              <CardHeader className="pb-3 text-destructive">
                <div className="flex items-center gap-2">
                  <UserX className="w-5 h-5" />
                  <CardTitle className="text-lg font-display">Alerta de Ausência</CardTitle>
                </div>
                <CardDescription>Sumidos nos últimos eventos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {ausentes.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Toda a galera está presente!</p>
                ) : (
                  ausentes.map((j) => (
                    <div key={j.id} className="flex items-center justify-between p-3 rounded-xl bg-destructive/5 border border-destructive/10 group">
                      <div>
                        <p className="font-semibold text-sm">{j.nome}</p>
                        <p className="text-xs text-muted-foreground">Fazer contato agora</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          if (j.telefone) {
                            const phone = j.telefone.replace(/\D/g, '');
                            window.open(`https://wa.me/${phone.startsWith('55') ? phone : '55' + phone}`, '_blank');
                          } else {
                            toast.error('Jovem sem telefone cadastrado');
                          }
                        }}
                      >
                        <Megaphone className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Eventos e Campanhas */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="glass-card animate-slide-up opacity-0 hover:shadow-lg transition-shadow cursor-pointer group" style={{ animationDelay: '800ms', animationFillMode: 'forwards' }}>
                <Link to="/eventos">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-accent/10 text-accent">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">Próximo Evento</h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {proximoEvento ? `${proximoEvento.titulo}` : 'Nenhum agendado'}
                        </p>
                        {proximoEvento && <p className="text-[10px] text-muted-foreground/70 mt-1">{proximoEvento.data}</p>}
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  </CardContent>
                </Link>
              </Card>

              <Card className="glass-card animate-slide-up opacity-0 hover:shadow-lg transition-shadow cursor-pointer group" style={{ animationDelay: '900ms', animationFillMode: 'forwards' }}>
                <Link to="/campanhas">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-success/10 text-success">
                        <Megaphone className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">Campanhas</h3>
                        <p className="text-sm text-muted-foreground">{stats.campanhasAtivas} ativa(s) agora</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  </CardContent>
                </Link>
              </Card>
            </div>

            {/* Aniversariantes do Mês */}
            <Card className="glass-card animate-slide-up opacity-0 lg:col-span-1" style={{ animationDelay: '1000ms', animationFillMode: 'forwards' }}>
              <CardHeader className="pb-3 text-info">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  <CardTitle className="text-lg font-display">Aniversários</CardTitle>
                </div>
                <CardDescription>Celebrando este mês</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {aniversariantes.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Nenhum niver este mês.</p>
                ) : (
                  aniversariantes.map((n) => (
                    <div key={n.id} className="flex items-center justify-between p-3 rounded-xl bg-info/5 border border-info/10">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-info/20 flex items-center justify-center text-info text-xs font-bold">
                          {n.nome.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{n.nome}</p>
                          <p className="text-xs text-muted-foreground">{n.data}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <Button variant="outline" className="w-full text-[10px] text-muted-foreground border-dashed h-8" asChild>
                  <Link to="/aniversariantes">Ver todos</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
