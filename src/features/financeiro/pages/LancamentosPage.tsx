import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Loader2, Trash2, Edit, DollarSign, ArrowUpCircle, ArrowDownCircle, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Lancamento {
    id: string; tipo: string; tipo_pessoa: string | null; pessoa_id: string | null; pessoa_nome: string | null;
    plano_conta_id: string | null; centro_custo_id: string | null; forma_pagamento_id: string | null; conta_bancaria_id: string | null;
    valor: number; descricao: string | null; data_lancamento: string; status: string; created_at: string;
    fin_planos_conta?: { nome: string } | null; fin_centros_custo?: { nome: string } | null;
    fin_formas_pagamento?: { nome: string } | null; fin_contas_bancarias?: { nome: string } | null;
}

interface SelectOption { id: string; nome: string; }

export default function LancamentosPage() {
    const [items, setItems] = useState<Lancamento[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // Lookup data
    const [planosContas, setPlanosContas] = useState<SelectOption[]>([]);
    const [centrosCusto, setCentrosCusto] = useState<SelectOption[]>([]);
    const [formasPagamento, setFormasPagamento] = useState<SelectOption[]>([]);
    const [contasBancarias, setContasBancarias] = useState<SelectOption[]>([]);
    const [pessoasSearch, setPessoasSearch] = useState<{ id: string; nome: string; tipo: string }[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        tipo: 'entrada', tipo_pessoa: '', pessoa_id: '', pessoa_nome: '',
        plano_conta_id: '', centro_custo_id: '', forma_pagamento_id: '', conta_bancaria_id: '',
        valor: '', descricao: '', data_lancamento: new Date().toISOString().split('T')[0],
    });

    useEffect(() => { fetchItems(); fetchLookups(); }, []);

    async function fetchItems() {
        try {
            const { data, error } = await supabase
                .from('fin_lancamentos')
                .select('*, fin_planos_conta(nome), fin_centros_custo(nome), fin_formas_pagamento(nome), fin_contas_bancarias(nome)')
                .order('data_lancamento', { ascending: false })
                .order('created_at', { ascending: false });
            if (error) throw error;
            setItems((data as any[]) || []);
        } catch { toast.error('Erro ao carregar'); } finally { setLoading(false); }
    }

    async function fetchLookups() {
        const [pc, cc, fp, cb] = await Promise.all([
            supabase.from('fin_planos_conta').select('id, nome').eq('ativo', true).order('nome'),
            supabase.from('fin_centros_custo').select('id, nome').eq('ativo', true).order('nome'),
            supabase.from('fin_formas_pagamento').select('id, nome').eq('ativo', true).order('nome'),
            supabase.from('fin_contas_bancarias').select('id, nome').eq('ativo', true).order('nome'),
        ]);
        setPlanosContas((pc.data as SelectOption[]) || []);
        setCentrosCusto((cc.data as SelectOption[]) || []);
        setFormasPagamento((fp.data as SelectOption[]) || []);
        setContasBancarias((cb.data as SelectOption[]) || []);
    }

    async function searchPessoas(term: string) {
        setSearchTerm(term);
        if (term.length < 2) { setPessoasSearch([]); return; }
        const tipo = formData.tipo_pessoa;
        const results: { id: string; nome: string; tipo: string }[] = [];

        if (!tipo || tipo === 'jovem') {
            const { data } = await supabase.from('jovens').select('id, nome').ilike('nome', `%${term}%`).limit(5);
            data?.forEach(d => results.push({ id: d.id, nome: d.nome, tipo: 'jovem' }));
        }
        if (!tipo || tipo === 'lider') {
            const { data } = await supabase.from('lideres').select('id, nome').ilike('nome', `%${term}%`).limit(5);
            data?.forEach(d => results.push({ id: d.id, nome: d.nome, tipo: 'lider' }));
        }
        if (!tipo || tipo === 'visitante') {
            const { data } = await supabase.from('jovens_visitantes').select('id, nome').ilike('nome', `%${term}%`).limit(5);
            data?.forEach(d => results.push({ id: d.id, nome: d.nome, tipo: 'visitante' }));
        }
        setPessoasSearch(results);
    }

    function selectPessoa(p: { id: string; nome: string; tipo: string }) {
        setFormData({ ...formData, pessoa_id: p.id, pessoa_nome: p.nome, tipo_pessoa: p.tipo });
        setPessoasSearch([]);
        setSearchTerm(p.nome);
    }

    function openEdit(item: Lancamento) {
        setEditingId(item.id);
        setFormData({
            tipo: item.tipo, tipo_pessoa: item.tipo_pessoa || '', pessoa_id: item.pessoa_id || '', pessoa_nome: item.pessoa_nome || '',
            plano_conta_id: item.plano_conta_id || '', centro_custo_id: item.centro_custo_id || '',
            forma_pagamento_id: item.forma_pagamento_id || '', conta_bancaria_id: item.conta_bancaria_id || '',
            valor: String(item.valor), descricao: item.descricao || '', data_lancamento: item.data_lancamento,
        });
        setSearchTerm(item.pessoa_nome || '');
        setIsDialogOpen(true);
    }

    function resetForm() {
        setEditingId(null);
        setFormData({
            tipo: 'entrada', tipo_pessoa: '', pessoa_id: '', pessoa_nome: '',
            plano_conta_id: '', centro_custo_id: '', forma_pagamento_id: '', conta_bancaria_id: '',
            valor: '', descricao: '', data_lancamento: new Date().toISOString().split('T')[0],
        });
        setSearchTerm('');
        setPessoasSearch([]);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload: any = {
                tipo: formData.tipo,
                tipo_pessoa: formData.tipo_pessoa || null,
                pessoa_id: formData.pessoa_id || null,
                pessoa_nome: formData.pessoa_nome || null,
                plano_conta_id: formData.plano_conta_id || null,
                centro_custo_id: formData.centro_custo_id || null,
                forma_pagamento_id: formData.forma_pagamento_id || null,
                conta_bancaria_id: formData.conta_bancaria_id || null,
                valor: parseFloat(formData.valor) || 0,
                descricao: formData.descricao || null,
                data_lancamento: formData.data_lancamento,
            };
            if (editingId) {
                const { error } = await supabase.from('fin_lancamentos').update(payload).eq('id', editingId);
                if (error) throw error;
                toast.success('Atualizado!');
            } else {
                const { error } = await supabase.from('fin_lancamentos').insert(payload);
                if (error) throw error;
                toast.success('Lançamento criado!');
            }
            setIsDialogOpen(false); resetForm(); fetchItems();
        } catch (err: any) { toast.error('Erro: ' + err.message); } finally { setIsSubmitting(false); }
    }

    async function handleDelete() {
        if (!deleteId) return;
        try {
            const { error } = await supabase.from('fin_lancamentos').delete().eq('id', deleteId);
            if (error) throw error;
            toast.success('Excluído!'); fetchItems();
        } catch (err: any) { toast.error('Erro: ' + err.message); } finally { setDeleteId(null); }
    }

    function formatCurrency(v: number) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v); }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-foreground">Lançamentos</h1>
                    <p className="text-muted-foreground mt-1">Registre entradas e saídas financeiras</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={open => { setIsDialogOpen(open); if (!open) resetForm(); }}>
                    <DialogTrigger asChild><Button variant="hero"><Plus className="w-4 h-4" /> Novo Lançamento</Button></DialogTrigger>
                    <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="font-display">{editingId ? 'Editar' : 'Novo'} Lançamento</DialogTitle>
                            <DialogDescription>Preencha os dados do lançamento financeiro</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                            {/* Tipo e Data */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label>Tipo *</Label>
                                    <Select value={formData.tipo} onValueChange={v => setFormData({ ...formData, tipo: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="entrada">
                                                <span className="flex items-center gap-2"><ArrowUpCircle className="w-4 h-4 text-success" /> Entrada</span>
                                            </SelectItem>
                                            <SelectItem value="saida">
                                                <span className="flex items-center gap-2"><ArrowDownCircle className="w-4 h-4 text-destructive" /> Saída</span>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Data *</Label>
                                    <Input type="date" value={formData.data_lancamento} onChange={e => setFormData({ ...formData, data_lancamento: e.target.value })} required />
                                </div>
                            </div>

                            {/* Tipo Pessoa e Pessoa */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label>Tipo Pessoa</Label>
                                    <Select value={formData.tipo_pessoa} onValueChange={v => { setFormData({ ...formData, tipo_pessoa: v, pessoa_id: '', pessoa_nome: '' }); setSearchTerm(''); }}>
                                        <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="lider">Líder</SelectItem>
                                            <SelectItem value="visitante">Visitante</SelectItem>
                                            <SelectItem value="jovem">Jovem</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2 relative">
                                    <Label>Pessoa</Label>
                                    <div className="relative">
                                        <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                                        <Input
                                            className="pl-9"
                                            value={searchTerm}
                                            onChange={e => searchPessoas(e.target.value)}
                                            placeholder="Buscar nome..."
                                        />
                                    </div>
                                    {pessoasSearch.length > 0 && (
                                        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-40 overflow-y-auto">
                                            {pessoasSearch.map(p => (
                                                <button key={`${p.tipo}-${p.id}`} type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex justify-between" onClick={() => selectPessoa(p)}>
                                                    <span>{p.nome}</span>
                                                    <Badge variant="outline" className="text-[10px] ml-2">{p.tipo}</Badge>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Valor */}
                            <div className="space-y-2">
                                <Label>Valor (R$) *</Label>
                                <Input type="number" step="0.01" min="0" value={formData.valor} onChange={e => setFormData({ ...formData, valor: e.target.value })} placeholder="0,00" required />
                            </div>

                            {/* Plano de Conta e Centro de Custo */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label>Plano de Conta</Label>
                                    <Select value={formData.plano_conta_id} onValueChange={v => setFormData({ ...formData, plano_conta_id: v })}>
                                        <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                                        <SelectContent>{planosContas.map(o => <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Centro de Custo</Label>
                                    <Select value={formData.centro_custo_id} onValueChange={v => setFormData({ ...formData, centro_custo_id: v })}>
                                        <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                                        <SelectContent>{centrosCusto.map(o => <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Forma Pagamento e Conta Bancária */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label>Forma de Pagamento</Label>
                                    <Select value={formData.forma_pagamento_id} onValueChange={v => setFormData({ ...formData, forma_pagamento_id: v })}>
                                        <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                                        <SelectContent>{formasPagamento.map(o => <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Conta Bancária</Label>
                                    <Select value={formData.conta_bancaria_id} onValueChange={v => setFormData({ ...formData, conta_bancaria_id: v })}>
                                        <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                                        <SelectContent>{contasBancarias.map(o => <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Descrição */}
                            <div className="space-y-2">
                                <Label>Descrição</Label>
                                <Textarea value={formData.descricao} onChange={e => setFormData({ ...formData, descricao: e.target.value })} placeholder="Observações sobre o lançamento" rows={2} />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                                <Button type="submit" variant="hero" disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? 'Salvar' : 'Criar Lançamento'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="glass-card overflow-hidden">
                {loading ? <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                    : items.length === 0 ? <div className="flex flex-col items-center justify-center py-12 text-center"><DollarSign className="w-12 h-12 text-muted-foreground/50 mb-4" /><h3 className="font-semibold">Nenhum lançamento</h3><p className="text-sm text-muted-foreground mt-1">Registre o primeiro lançamento</p></div>
                        : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Data</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Pessoa</TableHead>
                                        <TableHead>Descrição</TableHead>
                                        <TableHead className="hidden lg:table-cell">Plano de Conta</TableHead>
                                        <TableHead className="hidden lg:table-cell">F. Pagamento</TableHead>
                                        <TableHead className="text-right">Valor</TableHead>
                                        <TableHead className="w-[80px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell className="whitespace-nowrap">{format(parseISO(item.data_lancamento), 'dd/MM/yy')}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={item.tipo === 'entrada' ? 'border-success/50 text-success' : 'border-destructive/50 text-destructive'}>
                                                    {item.tipo === 'entrada' ? '↑ Entrada' : '↓ Saída'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="text-sm font-medium">{item.pessoa_nome || '-'}</p>
                                                    {item.tipo_pessoa && <p className="text-[10px] text-muted-foreground uppercase">{item.tipo_pessoa}</p>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="max-w-[200px] truncate text-muted-foreground">{item.descricao || '-'}</TableCell>
                                            <TableCell className="hidden lg:table-cell text-muted-foreground">{(item as any).fin_planos_conta?.nome || '-'}</TableCell>
                                            <TableCell className="hidden lg:table-cell text-muted-foreground">{(item as any).fin_formas_pagamento?.nome || '-'}</TableCell>
                                            <TableCell className={`text-right font-mono font-semibold ${item.tipo === 'entrada' ? 'text-success' : 'text-destructive'}`}>
                                                {item.tipo === 'entrada' ? '+' : '-'}{formatCurrency(item.valor)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-1">
                                                    <Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Edit className="w-4 h-4" /></Button>
                                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(item.id)}><Trash2 className="w-4 h-4" /></Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
            </Card>

            <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
                <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle><AlertDialogDescription>Ação irreversível.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
