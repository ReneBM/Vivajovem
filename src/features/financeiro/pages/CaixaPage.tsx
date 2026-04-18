import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, ArrowUpCircle, ArrowDownCircle, Wallet, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Lancamento {
    id: string; tipo: string; pessoa_nome: string | null; valor: number; descricao: string | null;
    data_lancamento: string; status: string;
    fin_planos_conta?: { nome: string } | null; fin_formas_pagamento?: { nome: string } | null;
}

export default function CaixaPage() {
    const [items, setItems] = useState<Lancamento[]>([]);
    const [loading, setLoading] = useState(true);
    const [dataInicio, setDataInicio] = useState(startOfMonth(new Date()).toISOString().split('T')[0]);
    const [dataFim, setDataFim] = useState(endOfMonth(new Date()).toISOString().split('T')[0]);

    useEffect(() => { fetchItems(); }, [dataInicio, dataFim]);

    async function fetchItems() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('fin_lancamentos')
                .select('*, fin_planos_conta(nome), fin_formas_pagamento(nome)')
                .gte('data_lancamento', dataInicio)
                .lte('data_lancamento', dataFim)
                .order('data_lancamento', { ascending: false })
                .order('created_at', { ascending: false });
            if (error) throw error;
            setItems((data as any[]) || []);
        } catch { toast.error('Erro ao carregar'); } finally { setLoading(false); }
    }

    const entradas = items.filter(i => i.tipo === 'entrada').reduce((s, i) => s + Number(i.valor), 0);
    const saidas = items.filter(i => i.tipo === 'saida').reduce((s, i) => s + Number(i.valor), 0);
    const saldo = entradas - saidas;

    function fmt(v: number) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v); }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-foreground">Caixa</h1>
                    <p className="text-muted-foreground mt-1">Resumo financeiro por período</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Label className="text-xs whitespace-nowrap">De:</Label>
                        <Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="w-[150px]" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Label className="text-xs whitespace-nowrap">Até:</Label>
                        <Input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="w-[150px]" />
                    </div>
                </div>
            </div>

            {/* Cards de Resumo */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="glass-card border-success/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground font-medium">Entradas</p>
                                <p className="text-2xl font-bold font-mono text-success mt-1">{fmt(entradas)}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-success" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="glass-card border-destructive/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground font-medium">Saídas</p>
                                <p className="text-2xl font-bold font-mono text-destructive mt-1">{fmt(saidas)}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                                <TrendingDown className="w-6 h-6 text-destructive" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className={`glass-card ${saldo >= 0 ? 'border-primary/20' : 'border-destructive/20'}`}>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground font-medium">Saldo</p>
                                <p className={`text-2xl font-bold font-mono mt-1 ${saldo >= 0 ? 'text-primary' : 'text-destructive'}`}>{fmt(saldo)}</p>
                            </div>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${saldo >= 0 ? 'bg-primary/10' : 'bg-destructive/10'}`}>
                                <Wallet className={`w-6 h-6 ${saldo >= 0 ? 'text-primary' : 'text-destructive'}`} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Lista de Movimentações */}
            <Card className="glass-card overflow-hidden">
                <CardHeader>
                    <CardTitle className="font-display text-lg">Movimentações</CardTitle>
                    <CardDescription>{items.length} lançamento(s) no período</CardDescription>
                </CardHeader>
                {loading ? <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                    : items.length === 0 ? <div className="flex flex-col items-center justify-center py-12 text-center"><DollarSign className="w-12 h-12 text-muted-foreground/50 mb-4" /><h3 className="font-semibold">Sem movimentações</h3><p className="text-sm text-muted-foreground mt-1">Nenhum lançamento neste período</p></div>
                        : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Data</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Pessoa</TableHead>
                                        <TableHead>Descrição</TableHead>
                                        <TableHead className="hidden md:table-cell">Plano</TableHead>
                                        <TableHead className="hidden md:table-cell">Pagamento</TableHead>
                                        <TableHead className="text-right">Valor</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell className="whitespace-nowrap">{format(parseISO(item.data_lancamento), 'dd/MM/yy')}</TableCell>
                                            <TableCell>
                                                {item.tipo === 'entrada'
                                                    ? <span className="flex items-center gap-1 text-success text-sm"><ArrowUpCircle className="w-3.5 h-3.5" /> Entrada</span>
                                                    : <span className="flex items-center gap-1 text-destructive text-sm"><ArrowDownCircle className="w-3.5 h-3.5" /> Saída</span>
                                                }
                                            </TableCell>
                                            <TableCell className="text-sm">{item.pessoa_nome || '-'}</TableCell>
                                            <TableCell className="max-w-[200px] truncate text-muted-foreground text-sm">{item.descricao || '-'}</TableCell>
                                            <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{(item as any).fin_planos_conta?.nome || '-'}</TableCell>
                                            <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{(item as any).fin_formas_pagamento?.nome || '-'}</TableCell>
                                            <TableCell className={`text-right font-mono font-semibold ${item.tipo === 'entrada' ? 'text-success' : 'text-destructive'}`}>
                                                {item.tipo === 'entrada' ? '+' : '-'}{fmt(Number(item.valor))}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
            </Card>
        </div>
    );
}
