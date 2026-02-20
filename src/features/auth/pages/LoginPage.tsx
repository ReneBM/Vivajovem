import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowRight, Loader2, ShieldAlert } from 'lucide-react';
import { z } from 'zod';
import sloganImage from '@/assets/slogan-somosum.png';

const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 30;

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  const lockoutTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  const isLockedOut = lockoutUntil !== null && Date.now() < lockoutUntil;

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Countdown timer para lockout
  useEffect(() => {
    if (lockoutUntil) {
      lockoutTimerRef.current = setInterval(() => {
        const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
        if (remaining <= 0) {
          setLockoutUntil(null);
          setLockoutRemaining(0);
          setFailedAttempts(0);
          if (lockoutTimerRef.current) clearInterval(lockoutTimerRef.current);
        } else {
          setLockoutRemaining(remaining);
        }
      }, 1000);
    }
    return () => {
      if (lockoutTimerRef.current) clearInterval(lockoutTimerRef.current);
    };
  }, [lockoutUntil]);

  const validateForm = () => {
    try {
      loginSchema.parse({ email, password });
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach((e) => {
          if (e.path[0]) {
            newErrors[e.path[0] as string] = e.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLockedOut) {
      toast.error(`Aguarde ${lockoutRemaining}s antes de tentar novamente`);
      return;
    }

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);

        if (newAttempts >= MAX_ATTEMPTS) {
          const until = Date.now() + LOCKOUT_SECONDS * 1000;
          setLockoutUntil(until);
          setLockoutRemaining(LOCKOUT_SECONDS);
          toast.error(`Muitas tentativas. Bloqueado por ${LOCKOUT_SECONDS}s.`);
        } else if (error.message.includes('Invalid login credentials')) {
          toast.error(`Email ou senha incorretos (${MAX_ATTEMPTS - newAttempts} tentativas restantes)`);
        } else {
          toast.error('Erro ao fazer login. Tente novamente.');
        }
      } else {
        setFailedAttempts(0);
        setLockoutUntil(null);
        toast.success('Login realizado com sucesso!');
        navigate('/dashboard');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-background relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />

        <div className="relative z-10 flex flex-col items-center px-12 xl:px-20">
          <img
            src={sloganImage}
            alt="Somos Um - 1 Tessalonicenses 5:11"
            className="w-96 h-auto object-contain animate-fade-in"
          />
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-card">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex flex-col items-center mb-8">
            <img
              src={sloganImage}
              alt="Somos Um - 1 Tessalonicenses 5:11"
              className="w-64 h-auto object-contain mb-4"
            />
          </div>

          <Card className="border-border/50 shadow-xl animate-scale-in bg-card">
            <CardHeader className="space-y-1 text-center pb-6">
              <CardTitle className="text-2xl font-display text-foreground">
                Bem-vindo de volta!
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Entre com suas credenciais para acessar o sistema
              </CardDescription>
            </CardHeader>

            <CardContent>
              {isLockedOut && (
                <div className="flex items-center gap-3 p-3 mb-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <ShieldAlert className="w-5 h-5 text-destructive shrink-0" />
                  <p className="text-sm text-destructive">
                    Muitas tentativas. Aguarde <strong>{lockoutRemaining}s</strong> para tentar novamente.
                  </p>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={errors.email ? 'border-destructive' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={errors.password ? 'border-destructive' : ''}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  variant="hero"
                  size="lg"
                  disabled={isLoading || isLockedOut}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isLockedOut ? (
                    <>
                      <ShieldAlert className="w-4 h-4" />
                      Bloqueado ({lockoutRemaining}s)
                    </>
                  ) : (
                    <>
                      Entrar
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
