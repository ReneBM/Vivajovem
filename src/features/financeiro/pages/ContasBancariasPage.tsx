import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Loader2, Trash2, Edit, Landmark } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ContaBancaria {
    id: string; nome: string; banco: string | null; agencia: string | null; conta: string | null;
    tipo: string; ativo: boolean; created_at: string;
    formas_pagamento?: { id: string; nome: string }[];
}

interface SelectOption { id: string; nome: string; }

export default function ContasBancariasPage() {
    const [items, setItems] = useState<ContaBancaria[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [formasPagamento, setFormasPagamento] = useState<SelectOption[]>([]);
    const [selectedFormas, setSelectedFormas] = useState<string[]>([]);
    const [formData, setFormData] = useState({ nome: '', banco: '', agencia: '', conta: '', tipo: 'corrente', ativo: true });

    useEffect(() => { fetchItems(); fetchFormasPagamento(); }, []);

    async function fetchItems() {
        try {
            // Buscar contas
            const { data: contas, error } = await supabase.from('fin_contas_bancarias').select('*').order('nome');
            if (error) throw error;

            // Buscar relações N:N
            const { data: relacoes } = await supabase.from('fin_conta_formas_pagamento').select('conta_bancaria_id, forma_pagamento_id, fin_formas_pagamento(id, nome)');

            // Montar dados com formas de pagamento
            const contasComFormas = ((contas as any[]) || []).map(c => ({
                ...c,
                formas_pagamento: (relacoes as any[] || [])
                    .filter(r => r.conta_bancaria_id === c.id)
                    .map(r => r.fin_formas_pagamento)
                    .filter(Boolean),
            }));

            setItems(contasComFormas);
        } catch { toast.error('Erro ao carregar'); } finally { setLoading(false); }
    }

    async function fetchFormasPagamento() {
        const { data } = await supabase.from('fin_formas_pagamento').select('id, nome').eq('ativo', true).order('nome');
        setFormasPagamento((data as SelectOption[]) || []);
    }

    async function openEdit(item: ContaBancaria) {
        setEditingId(item.id);
        setFormData({ nome: item.nome, banco: item.banco || '', agencia: item.agencia || '', conta: item.conta || '', tipo: item.tipo, ativo: item.ativo });
        setSelectedFormas(item.formas_pagamento?.map(fp => fp.id) || []);
        setIsDialogOpen(true);
    }

    function resetForm() {
        setEditingId(null);
        setFormData({ nome: '', banco: '', agencia: '', conta: '', tipo: 'corrente', ativo: true });
        setSelectedFormas([]);
    }

    function toggleForma(id: string) {
        setSelectedFormas(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = { nome: formData.nome, banco: formData.banco || null, agencia: formData.agencia || null, conta: formData.conta || null, tipo: formData.tipo, ativo: formData.ativo };
            let contaId = editingId;

            if (editingId) {
                const { error } = await supabase.from('fin_contas_bancarias').update(payload as any).eq('id', editingId);
                if (error) throw error;
            } else {
                const { data, error } = await supabase.from('fin_contas_bancarias').insert(payload as any).select('id').single();
                if (error) throw error;
                contaId = data.id;
            }

            // Atualizar relações N:N: deletar todas e reinserir
            await supabase.from('fin_conta_formas_pagamento').delete().eq('conta_bancaria_id', contaId!);
            if (selectedFormas.length > 0) {
                const relacoes = selectedFormas.map(fpId => ({ conta_bancaria_id: contaId!, forma_pagamento_id: fpId }));
                await supabase.from('fin_conta_formas_pagamento').insert(relacoes as any);
            }

            toast.success(editingId ? 'Atualizado!' : 'Cadastrado!');
            setIsDialogOpen(false); resetForm(); fetchItems();
        } catch (err: any) { toast.error('Erro: ' + err.message); } finally { setIsSubmitting(false); }
    }

    async function handleDelete() {
        if (!deleteId) return;
        try {
            const { error } = await supabase.from('fin_contas_bancarias').delete().eq('id', deleteId);
            if (error) throw error;
            toast.success('Excluído!'); fetchItems();
        } catch (err: any) { toast.error('Erro: ' + err.message); } finally { setDeleteId(null); }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-foreground">Contas Bancárias</h1>
                    <p className="text-muted-foreground mt-1">Gerencie as contas bancárias</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={open => { setIsDialogOpen(open); if (!open) resetForm(); }}>
                    <DialogTrigger asChild><Button variant="hero"><Plus className="w-4 h-4" /> Nova Conta</Button></DialogTrigger>
                    <DialogContent className="sm:max-w-[450px]">
                        <DialogHeader>
                            <DialogTitle className="font-display">{editingId ? 'Editar' : 'Nova'} Conta Bancária</DialogTitle>
                            <DialogDescription>Preencha os dados</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                            <div className="space-y-2"><Label>Nome *</Label><Input value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} placeholder="Ex: Conta Principal..." required /></div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2"><Label>Banco</Label><Input value={formData.banco} onChange={e => setFormData({ ...formData, banco: e.target.value })} placeholder="Ex: Itaú" /></div>
                                <div className="space-y-2">
                                    <Label>Tipo</Label>
                                    <Select value={formData.tipo} onValueChange={v => setFormData({ ...formData, tipo: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="corrente">Corrente</SelectItem>
                                            <SelectItem value="poupanca">Poupança</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2"><Label>Agência</Label><Input value={formData.agencia} onChange={e => setFormData({ ...formData, agencia: e.target.value })} placeholder="0001" /></div>
                                <div className="space-y-2"><Label>Conta</Label><Input value={formData.conta} onChange={e => setFormData({ ...formData, conta: e.target.value })} placeholder="12345-6" /></div>
                            </div>

                            {/* Multi-select de Formas de Pagamento */}
                            <div className="space-y-2">
                                <Label>Formas de Pagamento</Label>
                                <div className="border rounded-md p-3 space-y-2 max-h-[150px] overflow-y-auto">
                                    {formasPagamento.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">Nenhuma forma cadastrada</p>
                                    ) : (
                                        formasPagamento.map(fp => (
                                            <label key={fp.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded px-2 py-1 -mx-1 transition-colors">
                                                <Checkbox
                                                    checked={selectedFormas.includes(fp.id)}
                                                    onCheckedChange={() => toggleForma(fp.id)}
                                                />
                                                <span className="text-sm">{fp.nome}</span>
                                            </label>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                                <Button type="submit" variant="hero" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? 'Salvar' : 'Cadastrar'}</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="glass-card overflow-hidden">
                {loading ? <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                    : items.length === 0 ? <div className="flex flex-col items-center justify-center py-12 text-center"><Landmark className="w-12 h-12 text-muted-foreground/50 mb-4" /><h3 className="font-semibold">Nenhuma conta cadastrada</h3><p className="text-sm text-muted-foreground mt-1">Comece cadastrando a primeira</p></div>
                        : (
                            <Table>
                                <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Banco</TableHead><TableHead className="hidden md:table-cell">Agência</TableHead><TableHead className="hidden md:table-cell">Conta</TableHead><TableHead>Tipo</TableHead><TableHead className="hidden md:table-cell">F. Pagamento</TableHead><TableHead>Status</TableHead><TableHead className="w-[100px]"></TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {items.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.nome}</TableCell>
                                            <TableCell>{item.banco || '-'}</TableCell>
                                            <TableCell className="hidden md:table-cell">{item.agencia || '-'}</TableCell>
                                            <TableCell className="hidden md:table-cell">{item.conta || '-'}</TableCell>
                                            <TableCell><Badge variant="outline">{item.tipo === 'corrente' ? 'Corrente' : 'Poupança'}</Badge></TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                <div className="flex flex-wrap gap-1">
                                                    {item.formas_pagamento && item.formas_pagamento.length > 0
                                                        ? item.formas_pagamento.map(fp => <Badge key={fp.id} variant="secondary" className="text-[10px]">{fp.nome}</Badge>)
                                                        : <span className="text-muted-foreground text-sm">-</span>
                                                    }
                                                </div>
                                            </TableCell>
                                            <TableCell><Badge variant={item.ativo ? 'default' : 'secondary'} className={item.ativo ? 'bg-success/10 text-success hover:bg-success/20' : ''}>{item.ativo ? 'Ativo' : 'Inativo'}</Badge></TableCell>
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
