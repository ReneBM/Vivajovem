import { useState } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { User, Shield, Key, Save, Loader2 } from 'lucide-react';

export default function PerfilPage() {
    const { user } = useAuth();
    const [saving, setSaving] = useState(false);

    function getInitials(email: string) { return email.slice(0, 2).toUpperCase(); }

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h1 className="text-3xl font-display font-bold text-foreground">Perfil</h1>
                <p className="text-muted-foreground mt-1">Suas informações pessoais e segurança da conta</p>
            </div>

            <Card className="glass-card">
                <CardHeader>
                    <div className="flex items-center gap-2"><User className="w-5 h-5 text-primary" /><CardTitle className="font-display">Perfil</CardTitle></div>
                    <CardDescription>Suas informações pessoais e conta</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center gap-6">
                        <Avatar className="h-20 w-20">
                            <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">{user?.email ? getInitials(user.email) : 'U'}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h3 className="font-semibold text-foreground text-lg">{user?.email}</h3>
                            <Badge className="mt-2 bg-primary/10 text-primary">Usuário</Badge>
                        </div>
                    </div>
                    <Separator />
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label>Email</Label>
                            <Input type="email" value={user?.email || ''} disabled className="bg-muted" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="glass-card">
                <CardHeader>
                    <div className="flex items-center gap-2"><Shield className="w-5 h-5 text-primary" /><CardTitle className="font-display">Segurança</CardTitle></div>
                    <CardDescription>Altere sua senha de acesso</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <form
                        onSubmit={async (e) => {
                            e.preventDefault();
                            const form = e.target as HTMLFormElement;
                            const senhaAtual = (form.elements.namedItem('senhaAtual') as HTMLInputElement).value;
                            const novaSenha = (form.elements.namedItem('novaSenha') as HTMLInputElement).value;
                            const confirmarSenha = (form.elements.namedItem('confirmarSenha') as HTMLInputElement).value;

                            if (novaSenha.length < 8) { toast.error('A nova senha deve ter no mínimo 8 caracteres'); return; }
                            if (!/[A-Z]/.test(novaSenha)) { toast.error('A nova senha deve conter pelo menos uma letra maiúscula'); return; }
                            if (!/[0-9]/.test(novaSenha)) { toast.error('A nova senha deve conter pelo menos um número'); return; }
                            if (novaSenha !== confirmarSenha) { toast.error('As senhas não coincidem'); return; }

                            setSaving(true);
                            try {
                                const { error: loginError } = await supabase.auth.signInWithPassword({
                                    email: user?.email || '',
                                    password: senhaAtual,
                                });
                                if (loginError) { toast.error('Senha atual incorreta'); setSaving(false); return; }

                                const { error: updateError } = await supabase.auth.updateUser({ password: novaSenha });
                                if (updateError) throw updateError;

                                toast.success('Senha alterada com sucesso!');
                                form.reset();
                            } catch (error: any) {
                                toast.error('Erro ao alterar senha: ' + (error.message || 'Tente novamente'));
                            } finally {
                                setSaving(false);
                            }
                        }}
                        className="space-y-4"
                    >
                        <div className="grid gap-2">
                            <Label htmlFor="senhaAtual">Senha Atual *</Label>
                            <Input id="senhaAtual" name="senhaAtual" type="password" placeholder="Digite sua senha atual" required />
                        </div>
                        <Separator />
                        <div className="grid gap-2">
                            <Label htmlFor="novaSenha">Nova Senha *</Label>
                            <Input id="novaSenha" name="novaSenha" type="password" placeholder="Mínimo 8 caracteres, 1 maiúscula, 1 número" required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="confirmarSenha">Confirmar Nova Senha *</Label>
                            <Input id="confirmarSenha" name="confirmarSenha" type="password" placeholder="Repita a nova senha" required />
                        </div>
                        <div className="flex justify-end pt-2">
                            <Button type="submit" disabled={saving}>
                                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Key className="w-4 h-4 mr-2" />}
                                Alterar Senha
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
