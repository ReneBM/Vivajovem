import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Loader2, CheckCircle, Megaphone, Calendar, User, Phone, Mail,
  MapPin, Heart, Instagram, Church, ArrowRight, Star, Zap, Users, CreditCard, AlertTriangle
} from 'lucide-react';
import { formatPhoneNumber, formatCPF } from '@/lib/formatters';
import logoViva from '@/assets/slogan-somosum.png';
import type { FieldConfig } from '@/features/campanhas/components/CampaignFieldsConfig';
import { DEFAULT_FIELDS } from '@/features/campanhas/components/CampaignFieldsConfig';

interface Campanha {
  id: string;
  nome: string;
  descricao: string | null;
  cor_primaria: string | null;
  cor_fundo: string | null;
  imagem_capa_url: string | null;
  ativa: boolean;
  campos_personalizados: any;
  slug: string;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  user: <User className="w-4 h-4" />,
  phone: <Phone className="w-4 h-4" />,
  mail: <Mail className="w-4 h-4" />,
  calendar: <Calendar className="w-4 h-4" />,
  church: <Church className="w-4 h-4" />,
  instagram: <Instagram className="w-4 h-4" />,
  mappin: <MapPin className="w-4 h-4" />,
  heart: <Heart className="w-4 h-4" />,
};

export default function InscricaoCampanha() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [campanha, setCampanha] = useState<Campanha | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false); // Track if it was an update
  const [formData, setFormData] = useState<Record<string, any>>({});

  const getEnabledFields = (): FieldConfig[] => {
    if (!campanha?.campos_personalizados) return DEFAULT_FIELDS.filter(f => f.enabled);
    const parsed = Array.isArray(campanha.campos_personalizados)
      ? campanha.campos_personalizados as FieldConfig[]
      : [];
    return parsed.length > 0 ? parsed.filter(f => f.enabled) : DEFAULT_FIELDS.filter(f => f.enabled);
  };

  const fields = getEnabledFields();

  useEffect(() => {
    if (slug) {
      fetchCampanha();
    }
  }, [slug]);

  async function fetchCampanha() {
    try {
      const { data, error } = await supabase
        .from('campanhas')
        .select('*')
        .eq('slug', slug)
        .eq('ativa', true)
        .maybeSingle();

      if (error) throw error;
      setCampanha(data as Campanha);
    } catch (error) {
      console.error('Error fetching campanha:', error);
      toast.error('Campanha não encontrada');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!campanha) return;
    setIsSubmitting(true);

    try {
      // Clean data for search
      const rawPhone = formData.telefone ? formData.telefone.replace(/\D/g, '') : null;
      const rawCPF = formData.cpf ? formData.cpf.replace(/\D/g, '') : null;

      let jovemId: string;
      let wasUpdated = false;

      // 1. Check if user exists (Priority: CPF > Phone)
      let existingJovem = null;

      if (rawCPF) {
        const { data } = await supabase
          .from('jovens')
          .select('id')
          .eq('cpf', rawCPF)
          .maybeSingle();
        existingJovem = data;
      }

      if (!existingJovem && rawPhone) {
        const { data } = await supabase
          .from('jovens')
          .select('id')
          .eq('telefone', formData.telefone) // Using formatted phone as stored in DB currently
          .maybeSingle();
        existingJovem = data;
      }

      const commonPayload: any = {
        nome: formData.nome,
        telefone: formData.telefone || null,
        cpf: rawCPF,
        data_nascimento: formData.data_nascimento || null,
        batizado: formData.batizado === 'Sim',
        updated_at: new Date().toISOString(),
      };

      if (formData.instagram) commonPayload.redes_sociais = { instagram: formData.instagram };

      if (existingJovem) {
        // UPDATE existing
        jovemId = existingJovem.id;
        wasUpdated = true;
        await supabase.from('jovens').update(commonPayload).eq('id', jovemId);
      } else {
        // CREATE new
        const { data: newJovem, error: createError } = await supabase
          .from('jovens')
          .insert({
            ...commonPayload,
            status: 'ATIVO' as const,
          })
          .select()
          .single();

        if (createError) throw createError;
        jovemId = newJovem.id;
      }

      // 2. Register inscription
      const { error: inscricaoError } = await supabase.from('inscricoes_campanha').insert({
        campanha_id: campanha.id,
        jovem_id: jovemId,
        nome_visitante: formData.nome,
        telefone: formData.telefone || null,
        idade: null // We could calculate from birthdate if needed
      });

      if (inscricaoError) throw inscricaoError;

      setIsUpdate(wasUpdated);
      setSubmitted(true);
      toast.success(wasUpdated ? 'Cadastro atualizado e inscrição realizada!' : 'Inscrição realizada com sucesso!');
    } catch (error) {
      console.error('Error submitting inscription:', error);
      toast.error('Erro ao realizar inscrição');
    } finally {
      setIsSubmitting(false);
    }
  }

  const corPrimaria = campanha?.cor_primaria || '#D4A84B';
  const corFundo = campanha?.cor_fundo || '#0a0a12';

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: `radial-gradient(ellipse at top, ${corFundo}ee 0%, #050508 100%)` }}
      >
        <div className="text-center">
          <div className="relative">
            <div
              className="w-20 h-20 rounded-full animate-spin"
              style={{
                border: `3px solid ${corPrimaria}15`,
                borderTopColor: corPrimaria
              }}
            />
            <div
              className="absolute inset-0 w-20 h-20 rounded-full blur-xl animate-pulse"
              style={{ backgroundColor: `${corPrimaria}30` }}
            />
            <Sparkles
              className="w-8 h-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse"
              style={{ color: corPrimaria }}
            />
          </div>
          <p className="mt-6 text-white/50 text-sm tracking-wide">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se houver erro de carregamento da campanha
  if (!campanha && !loading) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-4"
        style={{ background: 'radial-gradient(ellipse at top, #1a1a2e 0%, #050508 100%)' }}
      >
        <div className="text-center max-w-md">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-500/20 to-red-600/10 flex items-center justify-center mx-auto mb-8 relative">
            <AlertTriangle className="w-12 h-12 text-red-400" />
            <div className="absolute inset-0 rounded-full bg-red-500/20 blur-2xl" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Ops!</h1>
          <p className="text-white/50 text-lg mb-10">
            Campanha não encontrada ou link inválido.
          </p>
          <Button
            onClick={() => navigate('/')}
            className="h-12 px-8 bg-white/10 hover:bg-white/20 text-white border border-white/10"
          >
            Voltar ao início
          </Button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
        style={{ background: `radial-gradient(ellipse at top, ${corFundo}ee 0%, #050508 100%)` }}
      >
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-3xl opacity-20 animate-pulse"
            style={{ backgroundColor: corPrimaria }}
          />
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full animate-ping"
              style={{
                backgroundColor: corPrimaria,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.2}s`,
                animationDuration: '2s',
              }}
            />
          ))}
        </div>

        <div className="max-w-md w-full text-center relative z-10">
          {/* Success Animation */}
          <div className="relative mb-10">
            <div
              className="w-28 h-28 rounded-full flex items-center justify-center mx-auto animate-scale-in relative"
              style={{
                background: `linear-gradient(135deg, ${corPrimaria}, ${corPrimaria}99)`,
                boxShadow: `0 0 80px ${corPrimaria}50, 0 0 120px ${corPrimaria}30`
              }}
            >
              <CheckCircle className="w-14 h-14 text-white" />
            </div>
            <div
              className="absolute inset-0 w-28 h-28 rounded-full mx-auto"
              style={{
                background: `conic-gradient(from 0deg, transparent, ${corPrimaria}50, transparent)`,
                animation: 'spin 3s linear infinite'
              }}
            />
          </div>

          <h1
            className="text-5xl font-bold mb-5"
            style={{
              background: `linear-gradient(135deg, #fff, ${corPrimaria})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {isUpdate ? 'Dados Atualizados!' : 'Você está dentro!'}
          </h1>
          <p className="text-white/60 text-lg mb-10 leading-relaxed">
            {isUpdate
              ? 'Seus dados foram atualizados e sua inscrição confirmada.'
              : 'Sua inscrição foi confirmada com sucesso.'}
            <br />
            Prepare-se para viver algo incrível!
          </p>

          <div
            className="p-6 rounded-2xl mb-10 backdrop-blur-sm"
            style={{
              background: `linear-gradient(135deg, ${corPrimaria}15, ${corPrimaria}05)`,
              border: `1px solid ${corPrimaria}20`
            }}
          >
            <div className="flex items-center justify-center gap-3">
              <Star className="w-5 h-5" style={{ color: corPrimaria }} />
              <span className="text-white/80 font-medium">
                Fique atento ao seu WhatsApp!
              </span>
              <Star className="w-5 h-5" style={{ color: corPrimaria }} />
            </div>
          </div>

          <Button
            onClick={() => navigate('/')}
            className="h-14 px-10 text-lg font-semibold transition-all duration-300 hover:scale-105"
            style={{
              background: `linear-gradient(135deg, ${corPrimaria}, ${corPrimaria}cc)`,
              color: '#000',
              boxShadow: `0 10px 40px ${corPrimaria}40`
            }}
          >
            Voltar ao início
          </Button>
        </div>

        {/* Logo footer */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <img src={logoViva} alt="VIVA Jovem" className="w-14 h-14 opacity-40" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ background: `radial-gradient(ellipse at top, ${corFundo} 0%, #050508 70%, ${corFundo}90 100%)` }}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full blur-3xl opacity-10"
          style={{ backgroundColor: corPrimaria }}
        />
        <div
          className="absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl opacity-5"
          style={{ backgroundColor: corPrimaria }}
        />
        <div
          className="absolute top-1/3 right-0 w-64 h-64 rounded-full blur-3xl opacity-5"
          style={{ backgroundColor: corPrimaria }}
        />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(${corPrimaria}50 1px, transparent 1px), linear-gradient(90deg, ${corPrimaria}50 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      <div className="relative z-10 py-10 px-4">
        <div className="max-w-lg mx-auto">
          {/* Logo */}
          <div className="flex justify-center mb-10">
            <div className="relative group">
              <img src={logoViva} alt="VIVA Jovem" className="w-20 h-20 object-contain relative z-10 transition-transform group-hover:scale-110" />
              <div
                className="absolute inset-0 blur-2xl opacity-60 transition-opacity group-hover:opacity-80"
                style={{ backgroundColor: corPrimaria }}
              />
            </div>
          </div>

          {/* Cover Image */}
          {campanha.imagem_capa_url && (
            <div className="rounded-3xl overflow-hidden mb-10 shadow-2xl relative group">
              <img
                src={campanha.imagem_capa_url}
                alt={campanha.nome}
                className="w-full h-56 object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(to top, ${corFundo} 0%, transparent 60%)`
                }}
              />
            </div>
          )}

          {/* Header */}
          <div className="text-center mb-10">
            <div
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-6"
              style={{
                background: `linear-gradient(135deg, ${corPrimaria}20, ${corPrimaria}05)`,
                border: `1px solid ${corPrimaria}30`,
                boxShadow: `0 0 30px ${corPrimaria}10`
              }}
            >
              <Zap className="w-4 h-4" style={{ color: corPrimaria }} />
              <span className="text-sm font-semibold tracking-wide" style={{ color: corPrimaria }}>
                CAMPANHA ESPECIAL
              </span>
            </div>

            <h1
              className="text-4xl md:text-5xl font-bold mb-6 leading-tight"
              style={{
                background: `linear-gradient(135deg, #ffffff, ${corPrimaria})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {campanha.nome}
            </h1>

            {campanha.descricao && (
              <p className="text-white/50 text-lg leading-relaxed max-w-md mx-auto">
                {campanha.descricao}
              </p>
            )}
          </div>

          {/* Form Card */}
          <div
            className="rounded-3xl p-8 md:p-10 shadow-2xl backdrop-blur-sm relative overflow-hidden"
            style={{
              background: `linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)`,
              border: `1px solid rgba(255,255,255,0.08)`
            }}
          >
            {/* Form Fields */}
            <div className="relative z-10">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Faça sua inscrição
                </h2>
                <p className="text-white/40 text-sm">
                  {campanha.campos_personalizados ? 'Preencha seus dados para participar' : 'Preencha os campos abaixo para garantir sua vaga'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {fields.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <Label className="text-white/70 font-medium flex items-center gap-2">
                      {ICON_MAP[field.icon || 'heart']}
                      {field.label}
                      {field.required && <span className="text-red-400">*</span>}
                    </Label>

                    {field.type === 'select' && field.options ? (
                      <Select
                        value={formData[field.id] || ''}
                        onValueChange={(value) => setFormData({ ...formData, [field.id]: value })}
                        required={field.required}
                      >
                        <SelectTrigger
                          className="h-12 bg-white/5 border-white/10 text-white hover:bg-white/10 transition-colors"
                          style={{ borderColor: `${corPrimaria}20` }}
                        >
                          <SelectValue placeholder={`Selecione...`} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options.map((opt) => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
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
                        className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:bg-white/10 transition-colors"
                        style={{ borderColor: `${corPrimaria}20` }}
                      />
                    )}
                  </div>
                ))}

                <Button
                  type="submit"
                  className="w-full h-14 text-lg font-bold mt-8 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group"
                  style={{
                    background: `linear-gradient(135deg, ${corPrimaria}, ${corPrimaria}bb)`,
                    color: '#000',
                    boxShadow: `0 10px 40px ${corPrimaria}30`
                  }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processando...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>{fields.length > 2 ? 'Atualizar Dados' : 'Confirmar Inscrição'}</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  )}
                </Button>
              </form>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-12">
            <div className="flex items-center justify-center gap-2 mb-3">
              <img src={logoViva} alt="VIVA" className="w-8 h-8 opacity-50" />
              <span className="text-white/30 font-medium tracking-wide">VIVA Jovem</span>
            </div>
            <p className="text-white/20 text-sm">
              © {new Date().getFullYear()} • Todos os direitos reservados
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Sparkles({ className, style }: { className?: string, style?: any }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  );
}
