import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Loader2, Trash2, Edit, CreditCard } from 'lucide-react';
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

interface FormaPagamento {
    id: string;
    nome: string;
    ativo: boolean;
    created_at: string;
}

export default function FormasPagamentoPage() {
    const [items, setItems] = useState<FormaPagamento[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ nome: '', ativo: true });

    useEffect(() => { fetchItems(); }, []);

    async function fetchItems() {
        try {
            const { data, error } = await supabase.from('fin_formas_pagamento').select('*').order('nome');
            if (error) throw error;
            setItems((data as FormaPagamento[]) || []);
        } catch { toast.error('Erro ao carregar'); } finally { setLoading(false); }
    }

    function openEdit(item: FormaPagamento) {
        setEditingId(item.id);
        setFormData({ nome: item.nome, ativo: item.ativo });
        setIsDialogOpen(true);
    }

    function resetForm() {
        setEditingId(null);
        setFormData({ nome: '', ativo: true });
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingId) {
                const { error } = await supabase.from('fin_formas_pagamento').update(formData as any).eq('id', editingId);
                if (error) throw error;
                toast.success('Atualizado com sucesso!');
            } else {
                const { error } = await supabase.from('fin_formas_pagamento').insert(formData as any);
                if (error) throw error;
                toast.success('Cadastrado com sucesso!');
            }
            setIsDialogOpen(false);
            resetForm();
            fetchItems();
        } catch (err: any) { toast.error('Erro: ' + err.message); } finally { setIsSubmitting(false); }
    }

    async function handleDelete() {
        if (!deleteId) return;
        try {
            const { error } = await supabase.from('fin_formas_pagamento').delete().eq('id', deleteId);
            if (error) throw error;
            toast.success('Excluído!');
            fetchItems();
        } catch (err: any) { toast.error('Erro: ' + err.message); } finally { setDeleteId(null); }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-foreground">Formas de Pagamento</h1>
                    <p className="text-muted-foreground mt-1">Gerencie as formas de pagamento</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
                    <DialogTrigger asChild>
                        <Button variant="hero"><Plus className="w-4 h-4" /> Nova Forma</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[400px]">
                        <DialogHeader>
                            <DialogTitle className="font-display">{editingId ? 'Editar' : 'Nova'} Forma de Pagamento</DialogTitle>
                            <DialogDescription>Preencha os dados</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label>Nome *</Label>
                                <Input value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} placeholder="Ex: PIX, Dinheiro, Cartão..." required />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                                <Button type="submit" variant="hero" disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? 'Salvar' : 'Cadastrar'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="glass-card overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                ) : items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <CreditCard className="w-12 h-12 text-muted-foreground/50 mb-4" />
                        <h3 className="font-semibold">Nenhuma forma cadastrada</h3>
                        <p className="text-sm text-muted-foreground mt-1">Comece cadastrando a primeira</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-[100px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.nome}</TableCell>
                                    <TableCell>
                                        <Badge variant={item.ativo ? 'default' : 'secondary'} className={item.ativo ? 'bg-success/10 text-success hover:bg-success/20' : ''}>
                                            {item.ativo ? 'Ativo' : 'Inativo'}
                                        </Badge>
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
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                        <AlertDialogDescription>Ação irreversível.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
