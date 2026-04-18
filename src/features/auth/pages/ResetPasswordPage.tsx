import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, Lock, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import sloganImage from '@/assets/slogan-somosum.png';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    // Supabase automatically handles the token from the URL hash
    // and establishes a session when the page loads
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setHasSession(!!session);
    };

    // Listen for the PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setHasSession(true);
      }
    });

    checkSession();

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('As senhas não conferem');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      setSuccess(true);
      toast.success('Senha redefinida com sucesso!');

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/auth');
      }, 3000);
    } catch (error: any) {
      console.error('Error resetting password:', error);
      if (error.message?.includes('same_password')) {
        toast.error('A nova senha não pode ser igual à anterior');
      } else {
        toast.error('Erro ao redefinir senha. O link pode ter expirado.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state while checking session
  if (hasSession === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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

      {/* Right Panel */}
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
            {/* No valid session / expired link */}
            {!hasSession && !success ? (
              <>
                <CardHeader className="space-y-1 text-center pb-6">
                  <CardTitle className="text-2xl font-display text-foreground">
                    Link expirado
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Este link de redefinição não é mais válido
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center gap-4 py-4">
                    <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                      <AlertTriangle className="w-8 h-8 text-destructive" />
                    </div>
                    <p className="text-sm text-muted-foreground text-center">
                      O link pode ter expirado ou já foi utilizado. Solicite um novo link na tela de login.
                    </p>
                  </div>
                  <Button
                    className="w-full mt-4"
                    variant="hero"
                    onClick={() => navigate('/auth')}
                  >
                    Voltar ao login
                  </Button>
                </CardContent>
              </>
            ) : success ? (
              <>
                {/* Success state */}
                <CardHeader className="space-y-1 text-center pb-6">
                  <CardTitle className="text-2xl font-display text-foreground">
                    Senha redefinida!
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Sua senha foi alterada com sucesso
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center gap-4 py-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <CheckCircle2 className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground text-center">
                      Você será redirecionado para a tela de login em instantes...
                    </p>
                  </div>
                  <Button
                    className="w-full mt-4"
                    variant="hero"
                    onClick={() => navigate('/auth')}
                  >
                    Ir para o login
                  </Button>
                </CardContent>
              </>
            ) : (
              <>
                {/* Reset form */}
                <CardHeader className="space-y-1 text-center pb-6">
                  <CardTitle className="text-2xl font-display text-foreground">
                    Nova senha
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Digite sua nova senha abaixo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-password">Nova senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="new-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Mínimo 6 caracteres"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 pr-10"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirmar senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="confirm-password"
                          type={showConfirm ? 'text' : 'password'}
                          placeholder="Repita a nova senha"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="pl-10 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm(!showConfirm)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {password && confirmPassword && password !== confirmPassword && (
                      <p className="text-sm text-destructive">As senhas não conferem</p>
                    )}

                    <Button
                      type="submit"
                      className="w-full"
                      variant="hero"
                      size="lg"
                      disabled={isLoading || !password || !confirmPassword}
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Redefinir senha'
                      )}
                    </Button>
                  </form>
                </CardContent>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
