import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  Users,
  Calendar,
  TrendingUp,
  Download,
  FileText,
  UserCheck,
  Megaphone,
} from 'lucide-react';

const reportTypes = [
  {
    title: 'Frequência por Jovem',
    description: 'Relatório detalhado de presença individual de cada jovem nos eventos',
    icon: Users,
    color: 'bg-primary/10 text-primary',
  },
  {
    title: 'Frequência por Grupo',
    description: 'Análise de frequência agregada por grupo do ministério',
    icon: UserCheck,
    color: 'bg-success/10 text-success',
  },
  {
    title: 'Jovens Ausentes',
    description: 'Lista de jovens com ausências frequentes ou prolongadas',
    icon: Calendar,
    color: 'bg-destructive/10 text-destructive',
  },
  {
    title: 'Crescimento Mensal',
    description: 'Evolução do número de jovens cadastrados ao longo do tempo',
    icon: TrendingUp,
    color: 'bg-accent/10 text-accent',
  },
  {
    title: 'Conversão de Visitantes',
    description: 'Análise de visitantes que se tornaram membros efetivos',
    icon: Megaphone,
    color: 'bg-info/10 text-info',
  },
  {
    title: 'Resumo Geral',
    description: 'Visão consolidada de todas as métricas do ministério',
    icon: BarChart3,
    color: 'bg-primary/10 text-primary',
  },
];

export default function Relatorios() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground mt-1">
            Gere relatórios e análises do ministério
          </p>
        </div>
      </div>

      {/* Report Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportTypes.map((report, index) => (
          <Card
            key={report.title}
            className="glass-card animate-slide-up opacity-0 hover:shadow-lg transition-all group cursor-pointer"
            style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className={`p-3 rounded-xl ${report.color}`}>
                  <report.icon className="w-6 h-6" />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
              <CardTitle className="font-display mt-4">{report.title}</CardTitle>
              <CardDescription>{report.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <FileText className="w-4 h-4 mr-2" />
                Gerar Relatório
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info Card */}
      <Card className="glass-card border-l-4 border-l-info">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-info/10">
              <BarChart3 className="w-6 h-6 text-info" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Relatórios em desenvolvimento</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Os relatórios detalhados estão sendo desenvolvidos. Em breve você poderá exportar 
                dados em PDF e Excel, filtrar por período e comparar métricas ao longo do tempo.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
