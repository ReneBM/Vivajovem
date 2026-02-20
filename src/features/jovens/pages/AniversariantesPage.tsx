import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, Cake, Calendar, Gift } from 'lucide-react';
import { format, parseISO, isToday, isThisWeek, isThisMonth, getMonth, getDate } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Jovem {
  id: string;
  nome: string;
  data_nascimento: string | null;
  telefone: string | null;
  foto_url: string | null;
  status: string;
}

type FilterType = 'dia' | 'semana' | 'mes';

export default function Aniversariantes() {
  const [jovens, setJovens] = useState<Jovem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('mes');

  useEffect(() => {
    fetchJovens();
  }, []);

  async function fetchJovens() {
    try {
      const { data, error } = await supabase
        .from('jovens')
        .select('id, nome, data_nascimento, telefone, foto_url, status')
        .not('data_nascimento', 'is', null)
        .eq('status', 'ATIVO')
        .order('nome');

      if (error) throw error;
      setJovens(data || []);
    } catch (error) {
      console.error('Error fetching jovens:', error);
    } finally {
      setLoading(false);
    }
  }

  function isBirthdayToday(dateStr: string): boolean {
    const date = parseISO(dateStr);
    const today = new Date();
    return getMonth(date) === getMonth(today) && getDate(date) === getDate(today);
  }

  function isBirthdayThisWeek(dateStr: string): boolean {
    const date = parseISO(dateStr);
    const today = new Date();
    const currentYear = today.getFullYear();
    
    // Create a date in current year with same month/day
    const birthdayThisYear = new Date(currentYear, getMonth(date), getDate(date));
    
    return isThisWeek(birthdayThisYear, { weekStartsOn: 0 });
  }

  function isBirthdayThisMonth(dateStr: string): boolean {
    const date = parseISO(dateStr);
    const today = new Date();
    return getMonth(date) === getMonth(today);
  }

  const filteredJovens = jovens.filter((jovem) => {
    if (!jovem.data_nascimento) return false;
    
    switch (filter) {
      case 'dia':
        return isBirthdayToday(jovem.data_nascimento);
      case 'semana':
        return isBirthdayThisWeek(jovem.data_nascimento);
      case 'mes':
        return isBirthdayThisMonth(jovem.data_nascimento);
      default:
        return false;
    }
  }).sort((a, b) => {
    if (!a.data_nascimento || !b.data_nascimento) return 0;
    const dayA = getDate(parseISO(a.data_nascimento));
    const dayB = getDate(parseISO(b.data_nascimento));
    return dayA - dayB;
  });

  function getInitials(name: string) {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  function formatBirthday(dateStr: string) {
    const date = parseISO(dateStr);
    return format(date, "dd 'de' MMMM", { locale: ptBR });
  }

  function calculateAge(dateStr: string) {
    const birthDate = parseISO(dateStr);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  const filterLabels = {
    dia: 'Hoje',
    semana: 'Esta Semana',
    mes: 'Este Mês',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <Cake className="w-8 h-8 text-primary" />
            Aniversariantes
          </h1>
          <p className="text-muted-foreground mt-1">
            Veja quem está fazendo aniversário
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            {(['dia', 'semana', 'mes'] as FilterType[]).map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'outline'}
                onClick={() => setFilter(f)}
                className={filter === f ? 'bg-primary text-primary-foreground' : ''}
              >
                {f === 'dia' && <Calendar className="w-4 h-4 mr-2" />}
                {f === 'semana' && <Calendar className="w-4 h-4 mr-2" />}
                {f === 'mes' && <Gift className="w-4 h-4 mr-2" />}
                {filterLabels[f]}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">
              {jovens.filter(j => j.data_nascimento && isBirthdayToday(j.data_nascimento)).length}
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Esta Semana</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">
              {jovens.filter(j => j.data_nascimento && isBirthdayThisWeek(j.data_nascimento)).length}
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Este Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">
              {jovens.filter(j => j.data_nascimento && isBirthdayThisMonth(j.data_nascimento)).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredJovens.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Cake className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold text-foreground">Nenhum aniversariante</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Não há aniversariantes para o período selecionado
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredJovens.map((jovem, index) => (
            <Card
              key={jovem.id}
              className={`glass-card animate-slide-up opacity-0 hover:shadow-lg transition-shadow ${
                jovem.data_nascimento && isBirthdayToday(jovem.data_nascimento)
                  ? 'ring-2 ring-primary'
                  : ''
              }`}
              style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'forwards' }}
            >
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={jovem.foto_url || undefined} alt={jovem.nome} />
                    <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                      {getInitials(jovem.nome)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{jovem.nome}</h3>
                    <p className="text-sm text-muted-foreground">
                      {jovem.data_nascimento && formatBirthday(jovem.data_nascimento)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {jovem.data_nascimento && calculateAge(jovem.data_nascimento)} anos
                      </Badge>
                      {jovem.data_nascimento && isBirthdayToday(jovem.data_nascimento) && (
                        <Badge className="bg-primary text-primary-foreground text-xs">
                          🎉 Hoje!
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
