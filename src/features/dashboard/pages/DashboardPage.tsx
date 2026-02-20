
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalJovens: 0,
    totalLideres: 0,
    proximosEventos: 0,
    campanhasAtivas: 0,
    totalBatizados: 0,
  });
  const [frequencyData, setFrequencyData] = useState<{ month: string; presenca: number }[]>([]);
  const [growthData, setGrowthData] = useState<{ month: string; novos: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [proximoEvento, setProximoEvento] = useState<{ titulo: string; data: string } | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [jovensResult, lideresResult, eventosResult, campanhasResult, batizadosResult, proximoEventoResult] = await Promise.all([
          supabase.from('jovens').select('id', { count: 'exact' }).eq('status', 'ATIVO'),
          supabase.from('lideres').select('id', { count: 'exact' }).eq('status', 'ATIVO'),
          supabase.from('eventos').select('id', { count: 'exact' }).gte('data_evento', new Date().toISOString()),
          supabase.from('campanhas').select('id', { count: 'exact' }).eq('ativa', true),
          supabase.from('jovens').select('id', { count: 'exact' }).eq('batizado', true).eq('status', 'ATIVO'),
          supabase.from('eventos').select('titulo, data_evento').gte('data_evento', new Date().toISOString()).order('data_evento').limit(1),
        ]);

        setStats({
          totalJovens: jovensResult.count || 0,
          totalLideres: lideresResult.count || 0,
          proximosEventos: eventosResult.count || 0,
          campanhasAtivas: campanhasResult.count || 0,
          totalBatizados: batizadosResult.count || 0,
        });

        if (proximoEventoResult.data?.[0]) {
          const evento = proximoEventoResult.data[0];
          setProximoEvento({
            titulo: evento.titulo,
            data: new Date(evento.data_evento).toLocaleDateString('pt-BR', { weekday: 'long', hour: '2-digit', minute: '2-digit' }),
          });
        }

        // Fetch growth data - novos jovens por mês
        const { data: jovensData } = await supabase.from('jovens').select('created_at');
        if (jovensData) {
          const monthCounts: Record<string, number> = {};
          const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
          jovensData.forEach((j) => {
            const date = new Date(j.created_at);
            const monthKey = months[date.getMonth()];
            monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
          });
          const last6Months = months.slice(Math.max(0, new Date().getMonth() - 5), new Date().getMonth() + 1);
          setGrowthData(last6Months.map((m) => ({ month: m, novos: monthCounts[m] || 0 })));
        }

      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Visão geral do seu ministério</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link to="/relatorios">
              Ver relatórios
              <ArrowRight className="w-4 h-4" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total de Jovens"
              value={stats.totalJovens}
              change="+12% este mês"
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
              title="Próximos Eventos"
              value={stats.proximosEventos}
              change="Esta semana"
              changeType="neutral"
              icon={Calendar}
              iconColor="bg-accent/10 text-accent"
              delay={200}
            />
            <StatCard
              title="Batizados"
              value={stats.totalBatizados}
              change={`${stats.totalJovens > 0 ? Math.round((stats.totalBatizados / stats.totalJovens) * 100) : 0}% do total`}
              changeType="positive"
              icon={TrendingUp}
              iconColor="bg-info/10 text-info"
              delay={300}
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Frequency Chart */}
            <Card className="glass-card animate-slide-up opacity-0" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
              <CardHeader>
                <CardTitle className="font-display">Frequência Mensal</CardTitle>
                <CardDescription>Percentual de presença nos últimos 6 meses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={frequencyData}>
                      <defs>
                        <linearGradient id="colorPresenca" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
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
                      <Area
                        type="monotone"
                        dataKey="presenca"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorPresenca)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Growth Chart */}
            <Card className="glass-card animate-slide-up opacity-0" style={{ animationDelay: '500ms', animationFillMode: 'forwards' }}>
              <CardHeader>
                <CardTitle className="font-display">Crescimento</CardTitle>
                <CardDescription>Novos jovens cadastrados por mês</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
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

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="glass-card animate-slide-up opacity-0 hover:shadow-lg transition-shadow cursor-pointer group" style={{ animationDelay: '600ms', animationFillMode: 'forwards' }}>
              <Link to="/jovens">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-destructive/10 text-destructive">
                      <UserX className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">Jovens Ausentes</h3>
                      <p className="text-sm text-muted-foreground">3 jovens sem presença há 2+ semanas</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </CardContent>
              </Link>
            </Card>

            <Card className="glass-card animate-slide-up opacity-0 hover:shadow-lg transition-shadow cursor-pointer group" style={{ animationDelay: '700ms', animationFillMode: 'forwards' }}>
              <Link to="/eventos">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-accent/10 text-accent">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">Próximo Evento</h3>
                      <p className="text-sm text-muted-foreground">
                        {proximoEvento ? `${proximoEvento.titulo} - ${proximoEvento.data} ` : 'Nenhum evento agendado'}
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </CardContent>
              </Link>
            </Card>

            <Card className="glass-card animate-slide-up opacity-0 hover:shadow-lg transition-shadow cursor-pointer group" style={{ animationDelay: '800ms', animationFillMode: 'forwards' }}>
              <Link to="/campanhas">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-success/10 text-success">
                      <Megaphone className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">Campanhas Ativas</h3>
                      <p className="text-sm text-muted-foreground">{stats.campanhasAtivas} campanha(s) ativa(s)</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </CardContent>
              </Link>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
