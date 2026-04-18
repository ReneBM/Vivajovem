import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Loader2, Trash2, Edit, Package } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Produto {
    id: string; nome: string; descricao: string | null; preco: number; ativo: boolean; created_at: string;
}

export default function ProdutosPage() {
    const [items, setItems] = useState<Produto[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ nome: '', descricao: '', preco: '', ativo: true });

    useEffect(() => { fetchItems(); }, []);

    async function fetchItems() {
        try {
            const { data, error } = await supabase.from('fin_produtos').select('*').order('nome');
            if (error) throw error;
            setItems((data as Produto[]) || []);
        } catch { toast.error('Erro ao carregar'); } finally { setLoading(false); }
    }

    function openEdit(item: Produto) {
        setEditingId(item.id);
        setFormData({ nome: item.nome, descricao: item.descricao || '', preco: String(item.preco || ''), ativo: item.ativo });
        setIsDialogOpen(true);
    }

    function resetForm() { setEditingId(null); setFormData({ nome: '', descricao: '', preco: '', ativo: true }); }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = { nome: formData.nome, descricao: formData.descricao || null, preco: parseFloat(formData.preco) || 0, ativo: formData.ativo };
            if (editingId) {
                const { error } = await supabase.from('fin_produtos').update(payload as any).eq('id', editingId);
                if (error) throw error;
                toast.success('Atualizado!');
            } else {
                const { error } = await supabase.from('fin_produtos').insert(payload as any);
                if (error) throw error;
                toast.success('Cadastrado!');
            }
            setIsDialogOpen(false); resetForm(); fetchItems();
        } catch (err: any) { toast.error('Erro: ' + err.message); } finally { setIsSubmitting(false); }
    }

    async function handleDelete() {
        if (!deleteId) return;
        try {
            const { error } = await supabase.from('fin_produtos').delete().eq('id', deleteId);
            if (error) throw error;
            toast.success('Excluído!'); fetchItems();
        } catch (err: any) { toast.error('Erro: ' + err.message); } finally { setDeleteId(null); }
    }

    function formatCurrency(value: number) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-foreground">Produtos</h1>
                    <p className="text-muted-foreground mt-1">Gerencie os produtos</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={open => { setIsDialogOpen(open); if (!open) resetForm(); }}>
                    <DialogTrigger asChild><Button variant="hero"><Plus className="w-4 h-4" /> Novo Produto</Button></DialogTrigger>
                    <DialogContent className="sm:max-w-[400px]">
                        <DialogHeader>
                            <DialogTitle className="font-display">{editingId ? 'Editar' : 'Novo'} Produto</DialogTitle>
                            <DialogDescription>Preencha os dados</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                            <div className="space-y-2"><Label>Nome *</Label><Input value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} placeholder="Nome do produto" required /></div>
                            <div className="space-y-2"><Label>Preço (R$)</Label><Input type="number" step="0.01" min="0" value={formData.preco} onChange={e => setFormData({ ...formData, preco: e.target.value })} placeholder="0,00" /></div>
                            <div className="space-y-2"><Label>Descrição</Label><Textarea value={formData.descricao} onChange={e => setFormData({ ...formData, descricao: e.target.value })} placeholder="Descrição opcional" rows={3} /></div>
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
                    : items.length === 0 ? <div className="flex flex-col items-center justify-center py-12 text-center"><Package className="w-12 h-12 text-muted-foreground/50 mb-4" /><h3 className="font-semibold">Nenhum produto cadastrado</h3><p className="text-sm text-muted-foreground mt-1">Comece cadastrando o primeiro</p></div>
                        : (
                            <Table>
                                <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Preço</TableHead><TableHead className="hidden md:table-cell">Descrição</TableHead><TableHead>Status</TableHead><TableHead className="w-[100px]"></TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {items.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.nome}</TableCell>
                                            <TableCell className="font-mono">{formatCurrency(item.preco)}</TableCell>
                                            <TableCell className="hidden md:table-cell text-muted-foreground">{item.descricao || '-'}</TableCell>
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
