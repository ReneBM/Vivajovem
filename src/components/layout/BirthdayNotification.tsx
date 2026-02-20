import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Cake, X, PartyPopper } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Aniversariante {
  id: string;
  nome: string;
  foto_url: string | null;
  data_nascimento: string;
}

export default function BirthdayNotification() {
  const [aniversariantes, setAniversariantes] = useState<Aniversariante[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // Check if already shown today
    const lastShown = sessionStorage.getItem('birthday-notification-shown');
    const today = format(new Date(), 'yyyy-MM-dd');
    
    if (lastShown === today) {
      setHasChecked(true);
      return;
    }

    fetchAniversariantes();
  }, []);

  async function fetchAniversariantes() {
    try {
      const today = new Date();
      const day = today.getDate();
      const month = today.getMonth() + 1;

      const { data, error } = await supabase
        .from('jovens')
        .select('id, nome, foto_url, data_nascimento')
        .eq('status', 'ATIVO')
        .not('data_nascimento', 'is', null);

      if (error) throw error;

      // Filter by day and month
      const todayBirthdays = (data || []).filter(jovem => {
        if (!jovem.data_nascimento) return false;
        const birthDate = new Date(jovem.data_nascimento + 'T00:00:00');
        return birthDate.getDate() === day && (birthDate.getMonth() + 1) === month;
      });

      if (todayBirthdays.length > 0) {
        setAniversariantes(todayBirthdays);
        setIsVisible(true);
      }

      // Mark as shown for today
      sessionStorage.setItem('birthday-notification-shown', format(today, 'yyyy-MM-dd'));
      setHasChecked(true);
    } catch (error) {
      console.error('Error fetching aniversariantes:', error);
      setHasChecked(true);
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

  function handleClose() {
    setIsVisible(false);
  }

  if (!isVisible || aniversariantes.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className={cn(
          "relative w-full max-w-md bg-gradient-to-br from-card via-card to-primary/5 rounded-2xl shadow-2xl border border-primary/20 overflow-hidden",
          "animate-scale-in"
        )}
      >
        {/* Confetti decoration */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-accent to-primary" />
        
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground z-10"
          onClick={handleClose}
        >
          <X className="w-5 h-5" />
        </Button>

        <div className="p-6 pt-8">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
              <div className="relative p-4 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30">
                <Cake className="w-10 h-10 text-primary" />
              </div>
              <PartyPopper className="absolute -top-1 -right-1 w-6 h-6 text-accent animate-bounce" />
            </div>
            
            <h2 className="text-2xl font-display font-bold text-foreground">
              🎉 Feliz Aniversário!
            </h2>
            <p className="text-muted-foreground mt-1">
              {aniversariantes.length === 1 
                ? 'Temos um aniversariante hoje!' 
                : `Temos ${aniversariantes.length} aniversariantes hoje!`}
            </p>
          </div>

          {/* Birthday people list */}
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {aniversariantes.map((pessoa, index) => (
              <div
                key={pessoa.id}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-muted/50 to-transparent border border-border/50",
                  "animate-slide-up opacity-0"
                )}
                style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
              >
                <div className="relative">
                  <Avatar className="h-14 w-14 ring-2 ring-primary/30 ring-offset-2 ring-offset-background">
                    <AvatarImage src={pessoa.foto_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {getInitials(pessoa.nome)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute -bottom-1 -right-1 text-lg">🎂</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">
                    {pessoa.nome}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(pessoa.data_nascimento + 'T00:00:00'), "dd 'de' MMMM", { locale: ptBR })}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Action button */}
          <Button
            variant="hero"
            className="w-full mt-6"
            onClick={handleClose}
          >
            <PartyPopper className="w-4 h-4 mr-2" />
            Celebrar!
          </Button>
        </div>
      </div>
    </div>
  );
}