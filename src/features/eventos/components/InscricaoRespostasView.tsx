import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Loader2,
    Users,
    Copy,
    ArrowLeft,
    Download,
    QrCode
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

import { FieldConfig, InscricaoEvento, RespostaInscricao } from '@/types/app-types';

type Resposta = RespostaInscricao;

interface InscricaoRespostasViewProps {
    inscricao: InscricaoEvento;
    respostas: Resposta[];
    loading: boolean;
    onBack: () => void;
    onCopyLink: (slug: string) => void;
    onShowQRCode: (slug: string) => void;
}

export default function InscricaoRespostasView({
    inscricao,
    respostas,
    loading,
    onBack,
    onCopyLink,
    onShowQRCode
}: InscricaoRespostasViewProps) {
    const enabledFields = inscricao.campos_personalizados.filter(f => f.enabled);

    function handleExportCSV() {
        if (respostas.length === 0) return;

        // Header row
        const headers = ['#', ...enabledFields.map(f => f.label), 'Data Inscrição'];

        // Data rows
        const rows = respostas.map((r, i) => {
            const fieldValues = enabledFields.map(f => {
                const val = r.dados[f.id] || '';
                // Escape quotes for CSV
                return `"${val.replace(/"/g, '""')}"`;
            });
            return [`${i + 1}`, ...fieldValues, `"${format(parseISO(r.created_at), 'dd/MM/yyyy HH:mm')}"`].join(',');
        });

        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `inscritos_${inscricao.slug}_${format(new Date(), 'yyyyMMdd')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onBack}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h2 className="text-xl font-display font-bold">{inscricao.titulo}</h2>
                        <p className="text-sm text-muted-foreground">
                            {respostas.length} inscrito(s)
                            {inscricao.max_vagas ? ` / ${inscricao.max_vagas} vagas` : ''}
                        </p>
                    </div>
                </div>
                {respostas.length > 0 && (
                    <Button variant="outline" size="sm" onClick={handleExportCSV}>
                        <Download className="w-4 h-4 mr-2" /> Exportar CSV
                    </Button>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : respostas.length === 0 ? (
                <Card className="glass-card">
                    <CardContent className="flex flex-col items-center py-12 text-center">
                        <Users className="w-12 h-12 text-muted-foreground/50 mb-4" />
                        <h3 className="font-semibold">Nenhuma inscrição recebida</h3>
                        <p className="text-sm text-muted-foreground mt-1">Compartilhe o link para receber inscrições</p>
                        <div className="flex gap-2">
                            <Button variant="outline" className="mt-4" onClick={() => onCopyLink(inscricao.slug)}>
                                <Copy className="w-4 h-4 mr-2" /> Copiar Link
                            </Button>
                            <Button variant="hero" className="mt-4" onClick={() => onShowQRCode(inscricao.slug)}>
                                <QrCode className="w-4 h-4 mr-2" /> QR Code
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card className="glass-card">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50px]">#</TableHead>
                                        {enabledFields.map(f => (
                                            <TableHead key={f.id} className="whitespace-nowrap">{f.label}</TableHead>
                                        ))}
                                        <TableHead>Data</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {respostas.map((resp, i) => (
                                        <TableRow key={resp.id}>
                                            <TableCell className="font-medium text-muted-foreground">{i + 1}</TableCell>
                                            {enabledFields.map(f => (
                                                <TableCell key={f.id} className="whitespace-nowrap max-w-[200px] truncate" title={resp.dados[f.id]}>
                                                    {resp.dados[f.id] || '—'}
                                                </TableCell>
                                            ))}
                                            <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                                                {format(parseISO(resp.created_at), 'dd/MM HH:mm')}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
