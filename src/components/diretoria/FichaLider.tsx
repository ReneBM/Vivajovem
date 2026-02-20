import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetClose,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
    User,
    Phone,
    Mail,
    Loader2,
    Edit,
    Save,
    X,
    Church,
    CheckCircle,
    XCircle,
    Award,
} from 'lucide-react';
import { ImageUpload } from '@/components/shared/ImageUpload';
import { formatPhoneNumber } from '@/lib/formatters';

interface Lider {
    id: string;
    nome: string;
    telefone: string | null;
    email: string | null;
    status: string;
    foto_url: string | null;
    titulo_eclesiastico: string | null;
    created_at: string;
}

interface FichaLiderProps {
    lider: Lider | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdate: () => void;
}

export function FichaLider({ lider, open, onOpenChange, onUpdate }: FichaLiderProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        nome: '',
        telefone: '',
        email: '',
        titulo_eclesiastico: 'MEMBRO',
        status: 'ATIVO',
        foto_url: null as string | null,
    });

    useEffect(() => {
        if (lider) {
            setFormData({
                nome: lider.nome,
                telefone: lider.telefone || '',
                email: lider.email || '',
                titulo_eclesiastico: lider.titulo_eclesiastico || 'MEMBRO',
                status: lider.status,
                foto_url: lider.foto_url,
            });
            setIsEditing(false);
        }
    }, [lider]);

    async function handleSave() {
        if (!lider) return;
        setIsSubmitting(true);

        try {
            const { error } = await supabase
                .from('lideres')
                .update({
                    nome: formData.nome,
                    telefone: formData.telefone || null,
                    email: formData.email || null,
                    titulo_eclesiastico: formData.titulo_eclesiastico as any,
                    status: formData.status as any,
                    foto_url: formData.foto_url,
                })
                .eq('id', lider.id);

            if (error) throw error;

            toast.success('Dados atualizados com sucesso!');
            setIsEditing(false);
            onUpdate();
        } catch (error) {
            console.error('Error updating lider:', error);
            toast.error('Erro ao atualizar dados');
        } finally {
            setIsSubmitting(false);
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

    function formatDate(dateStr: string) {
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat('pt-BR').format(date);
    }

    if (!lider) return null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-lg overflow-y-auto [&>button]:hidden">
                <SheetHeader className="text-left">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <SheetClose asChild>
                                <Button variant="ghost" size="icon" className="-ml-2 text-muted-foreground hover:text-foreground">
                                    <X className="w-5 h-5" />
                                </Button>
                            </SheetClose>
                            <SheetTitle className="font-display text-xl">Ficha do Líder</SheetTitle>
                        </div>

                        {!isEditing ? (
                            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Editar
                            </Button>
                        ) : (
                            <div className="flex gap-2">
                                <Button variant="ghost" size="sm" onClick={() => {
                                    setIsEditing(false);
                                    if (lider) {
                                        setFormData({
                                            nome: lider.nome,
                                            telefone: lider.telefone || '',
                                            email: lider.email || '',
                                            titulo_eclesiastico: lider.titulo_eclesiastico || 'MEMBRO',
                                            status: lider.status,
                                            foto_url: lider.foto_url,
                                        });
                                    }
                                }}>
                                    Cancelar
                                </Button>
                                <Button variant="hero" size="sm" onClick={handleSave} disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            Salvar
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                </SheetHeader>

                <div className="mt-8 space-y-6">
                    {/* Profile Header */}
                    <div className="flex flex-col items-center text-center">
                        {isEditing ? (
                            <ImageUpload
                                currentImage={formData.foto_url}
                                onImageChange={(url) => setFormData({ ...formData, foto_url: url })}
                                folder="lideres"
                                initials={getInitials(formData.nome)}
                                size="lg"
                            />
                        ) : (
                            <Avatar className="h-24 w-24 ring-4 ring-primary/20">
                                <AvatarImage src={formData.foto_url || undefined} />
                                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                                    {getInitials(formData.nome)}
                                </AvatarFallback>
                            </Avatar>
                        )}

                        {isEditing ? (
                            <Input
                                value={formData.nome}
                                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                className="mt-4 text-center text-xl font-semibold max-w-[280px]"
                            />
                        ) : (
                            <h2 className="mt-4 text-xl font-semibold text-foreground">{formData.nome}</h2>
                        )}

                        <div className="flex items-center gap-2 mt-2 flex-wrap justify-center">
                            <Badge
                                variant={formData.status === 'ATIVO' ? 'default' : 'secondary'}
                                className={formData.status === 'ATIVO' ? 'bg-success/10 text-success border-success/20' : ''}
                            >
                                {formData.status === 'ATIVO' ? (
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                ) : (
                                    <XCircle className="w-3 h-3 mr-1" />
                                )}
                                {formData.status}
                            </Badge>
                            <Badge variant="outline" className="border-primary/50 text-primary">
                                <Award className="w-3 h-3 mr-1" />
                                {formData.titulo_eclesiastico?.charAt(0).toUpperCase() + formData.titulo_eclesiastico?.slice(1).toLowerCase()}
                            </Badge>
                        </div>
                    </div>

                    <Separator />

                    {/* Info Cards */}
                    <div className="space-y-4">
                        {/* Dados Pessoais */}
                        <div className="bg-muted/30 rounded-lg p-4 space-y-4">
                            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                <User className="w-4 h-4 text-primary" />
                                Dados Pessoais
                            </h3>

                            <div className="grid gap-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Phone className="w-4 h-4" />
                                        Telefone
                                    </span>
                                    {isEditing ? (
                                        <Input
                                            value={formData.telefone}
                                            onChange={(e) => setFormData({ ...formData, telefone: formatPhoneNumber(e.target.value) })}
                                            className="max-w-[180px] text-right"
                                            placeholder="(00) 00000-0000"
                                        />
                                    ) : (
                                        <span className="text-sm font-medium">{formData.telefone || '-'}</span>
                                    )}
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Mail className="w-4 h-4" />
                                        Email
                                    </span>
                                    {isEditing ? (
                                        <Input
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="max-w-[180px] text-right"
                                            placeholder="email@exemplo.com"
                                        />
                                    ) : (
                                        <span className="text-sm font-medium truncate max-w-[200px]">{formData.email || '-'}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Dados Eclesiásticos */}
                        <div className="bg-muted/30 rounded-lg p-4 space-y-4">
                            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                <Church className="w-4 h-4 text-primary" />
                                Dados Eclesiásticos
                            </h3>

                            <div className="grid gap-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Título</span>
                                    {isEditing ? (
                                        <Select
                                            value={formData.titulo_eclesiastico}
                                            onValueChange={(value) => setFormData({ ...formData, titulo_eclesiastico: value })}
                                        >
                                            <SelectTrigger className="max-w-[180px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="MEMBRO">Membro</SelectItem>
                                                <SelectItem value="OBREIRO">Obreiro</SelectItem>
                                                <SelectItem value="DIACONO">Diácono</SelectItem>
                                                <SelectItem value="PRESBITERO">Presbítero</SelectItem>
                                                <SelectItem value="EVANGELISTA">Evangelista</SelectItem>
                                                <SelectItem value="PASTOR">Pastor</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <span className="text-sm font-medium capitalize">
                                            {formData.titulo_eclesiastico?.toLowerCase()}
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Status</span>
                                    {isEditing ? (
                                        <Select
                                            value={formData.status}
                                            onValueChange={(value) => setFormData({ ...formData, status: value })}
                                        >
                                            <SelectTrigger className="max-w-[180px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ATIVO">Ativo</SelectItem>
                                                <SelectItem value="INATIVO">Inativo</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <span className="text-sm font-medium">{formData.status}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Info */}
                    <div className="pt-4 border-t border-border">
                        <p className="text-xs text-muted-foreground text-center">
                            Cadastrado em {formatDate(lider.created_at)}
                        </p>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
