import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
    Loader2,
    CheckCircle2,
    Users,
    Calendar,
    Clock,
    User,
    Phone,
    Mail,
    Church,
    MapPin,
    Heart,
    Instagram,
    AlertTriangle,
    CreditCard
} from 'lucide-react';

import { FieldConfig, InscricaoEvento } from '@/types/app-types';
import { formatPhoneNumber, formatCPF } from '@/lib/formatters';

type InscricaoData = InscricaoEvento;

const ICON_MAP: Record<string, React.ReactNode> = {
    user: <User className="w-4 h-4" />,
    creditcard: <CreditCard className="w-4 h-4" />,
    phone: <Phone className="w-4 h-4" />,
    mail: <Mail className="w-4 h-4" />,
    calendar: <Calendar className="w-4 h-4" />,
    church: <Church className="w-4 h-4" />,
    instagram: <Instagram className="w-4 h-4" />,
    mappin: <MapPin className="w-4 h-4" />,
    heart: <Heart className="w-4 h-4" />,
};

export default function InscricaoEventoPublicaPage() {
    const { slug } = useParams<{ slug: string }>();
    const [inscricao, setInscricao] = useState<InscricaoData | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [totalInscritos, setTotalInscritos] = useState(0);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (slug) fetchInscricao();
    }, [slug]);

    async function fetchInscricao() {
        setLoading(true);
        try {
            const { data, error: fetchErr } = await supabase
                .from('inscricoes_evento')
                .select('*')
                .eq('slug', slug)
                .eq('ativa', true)
                .single();

            if (fetchErr || !data) {
                setError('Inscrição não encontrada ou encerrada.');
                return;
            }

            const row = data as any;
            const inscData: InscricaoData = {
                ...row,
                campos_personalizados: (row.campos_personalizados || []) as unknown as FieldConfig[],
            };
            setInscricao(inscData);

            // Count existing registrations
            const { count } = await supabase
                .from('inscricoes_evento_respostas')
                .select('*', { count: 'exact', head: true })
                .eq('inscricao_id', row.id);
            setTotalInscritos(count || 0);

            // Check date limit
            if (inscData.data_limite) {
                const limit = new Date(inscData.data_limite + 'T23:59:59');
                if (new Date() > limit) {
                    setError('O prazo de inscrição já encerrou.');
                    return;
                }
            }

            // Check capacity
            if (inscData.max_vagas && (count || 0) >= inscData.max_vagas) {
                setError('Vagas esgotadas!');
                return;
            }

            // Initialize form
            const initial: Record<string, string> = {};
            inscData.campos_personalizados.filter(f => f.enabled).forEach(f => {
                initial[f.id] = '';
            });
            setFormData(initial);
        } catch {
            setError('Erro ao carregar inscrição.');
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!inscricao) return;
        setSubmitting(true);

        try {
            const { error: insertErr } = await supabase
                .from('inscricoes_evento_respostas')
                .insert({ inscricao_id: inscricao.id, dados: formData });

            if (insertErr) throw insertErr;
            setSubmitted(true);
        } catch {
            toast.error('Erro ao enviar inscrição. Tente novamente.');
        } finally {
            setSubmitting(false);
        }
    }

    const enabledFields = inscricao?.campos_personalizados.filter(f => f.enabled) || [];
    const vagasRestantes = inscricao?.max_vagas ? inscricao.max_vagas - totalInscritos : null;

    // ===== Loading =====
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    // ===== Error =====
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: inscricao?.cor_fundo || '#0F0F0F' }}>
                <div className="max-w-md w-full text-center">
                    <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: (inscricao?.cor_primaria || '#D4A017') + '20' }}>
                        <AlertTriangle className="w-10 h-10" style={{ color: inscricao?.cor_primaria || '#D4A017' }} />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Ops!</h1>
                    <p className="text-gray-400 text-lg">{error}</p>
                </div>
            </div>
        );
    }

    if (!inscricao) return null;

    const primary = inscricao.cor_primaria;
    const bg = inscricao.cor_fundo;

    // ===== Success =====
    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: bg }}>
                <div className="max-w-md w-full text-center animate-in fade-in-0 zoom-in-95 duration-500">
                    <div className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: primary + '20' }}>
                        <CheckCircle2 className="w-12 h-12" style={{ color: primary }} />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-3">Inscrição Confirmada!</h1>
                    <p className="text-gray-400 text-lg mb-2">Sua inscrição foi realizada com sucesso.</p>
                    <p className="text-gray-500 text-sm">Você receberá mais informações em breve.</p>
                    <div className="mt-8 p-4 rounded-xl border border-white/10 bg-white/5">
                        <p className="text-sm text-gray-400">Inscrito(a) como:</p>
                        <p className="text-lg font-semibold text-white">{formData.nome || '—'}</p>
                    </div>
                </div>
            </div>
        );
    }

    // ===== Form =====
    return (
        <div className="relative min-h-screen" style={{ backgroundColor: bg }}>
            {/* Background image — cobre toda a página */}
            {inscricao.imagem_capa_url && (
                <div className="fixed inset-0 z-0">
                    <img src={inscricao.imagem_capa_url} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, transparent 20%, ${bg}99 50%, ${bg}E6 75%, ${bg})` }} />
                </div>
            )}

            {/* Content overlay */}
            <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-12">
                <div className="max-w-lg w-full space-y-6">
                    {/* Title Section */}
                    <div className="text-center">
                        <div className="w-16 h-1 rounded-full mx-auto mb-6" style={{ backgroundColor: primary }} />
                        {inscricao.imagem_titulo_url ? (
                            <img src={inscricao.imagem_titulo_url} alt={inscricao.titulo} className="max-h-24 sm:max-h-32 object-contain mx-auto mb-4" />
                        ) : (
                            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight">
                                {inscricao.titulo}
                            </h1>
                        )}
                        {inscricao.descricao && (
                            <p className="text-lg text-gray-300 leading-relaxed">
                                {inscricao.descricao}
                            </p>
                        )}

                        {/* Stats bar */}
                        {inscricao.data_limite && (
                            <div className="flex items-center justify-center mt-6">
                                <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
                                    <Clock className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm text-gray-300">
                                        Até <strong className="text-white">{new Date(inscricao.data_limite + 'T00:00:00').toLocaleDateString('pt-BR')}</strong>
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Form Card — glassmorphism sobre a imagem */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div
                            className="p-6 sm:p-8 rounded-2xl border border-white/15 backdrop-blur-md shadow-2xl"
                            style={{ backgroundColor: `${bg}B3` }}
                        >
                            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: primary + '20' }}>
                                    <User className="w-4 h-4" style={{ color: primary }} />
                                </div>
                                Preencha seus dados
                            </h2>

                            <div className="space-y-4">
                                {enabledFields.map(field => {
                                    const icon = ICON_MAP[field.icon || 'heart'];

                                    if (field.type === 'select' && field.options) {
                                        return (
                                            <div key={field.id} className="space-y-2">
                                                <Label className="text-gray-300 flex items-center gap-2">
                                                    {icon} {field.label} {field.required && <span style={{ color: primary }}>*</span>}
                                                </Label>
                                                <Select
                                                    value={formData[field.id] || ''}
                                                    onValueChange={(v) => setFormData({ ...formData, [field.id]: v })}
                                                    required={field.required}
                                                >
                                                    <SelectTrigger className="bg-white/5 border-white/10 text-white focus:ring-1" style={{ '--tw-ring-color': primary } as React.CSSProperties}>
                                                        <SelectValue placeholder="Selecione..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {field.options.map(opt => (
                                                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div key={field.id} className="space-y-2">
                                            <Label className="text-gray-300 flex items-center gap-2">
                                                {icon} {field.label} {field.required && <span style={{ color: primary }}>*</span>}
                                            </Label>
                                            <Input
                                                type={field.type}
                                                value={
                                                    field.id === 'telefone'
                                                        ? formatPhoneNumber(formData[field.id] || '')
                                                        : field.id === 'cpf'
                                                            ? formatCPF(formData[field.id] || '')
                                                            : formData[field.id] || ''
                                                }
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    [field.id]: field.id === 'telefone'
                                                        ? formatPhoneNumber(e.target.value)
                                                        : field.id === 'cpf'
                                                            ? formatCPF(e.target.value)
                                                            : e.target.value
                                                })}
                                                placeholder={field.placeholder}
                                                required={field.required}
                                                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-1"
                                                style={{ '--tw-ring-color': primary } as React.CSSProperties}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={submitting}
                            className="w-full h-12 text-base font-semibold rounded-xl text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
                            style={{ backgroundColor: primary }}
                        >
                            {submitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                'Confirmar Inscrição'
                            )}
                        </Button>

                        <p className="text-center text-xs text-gray-500">
                            Ao se inscrever, você concorda com o uso dos seus dados para fins de organização do evento.
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}
