import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, QrCode } from 'lucide-react';
import { toast } from 'sonner';

interface QRCodeDialogProps {
    url: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
}

export default function QRCodeDialog({ url, open, onOpenChange, title }: QRCodeDialogProps) {
    const svgRef = useRef<SVGSVGElement>(null);

    const downloadQRCode = () => {
        if (!svgRef.current) return;

        const svgData = new XMLSerializer().serializeToString(svgRef.current);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            canvas.width = 1000;
            canvas.height = 1000;
            if (ctx) {
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, 1000, 1000);
                const pngFile = canvas.toDataURL('image/png');
                const downloadLink = document.createElement('a');
                downloadLink.download = `qrcode-${title || 'inscricao'}.png`;
                downloadLink.href = pngFile;
                downloadLink.click();
                toast.success('QR Code baixado com sucesso!');
            }
        };

        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <QrCode className="w-5 h-5 text-primary" />
                        QR Code de Inscrição
                    </DialogTitle>
                    <DialogDescription>
                        {title || 'Aponte a câmera para o código para acessar a página de inscrição.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center justify-center py-6 bg-white rounded-lg border border-border">
                    <QRCodeSVG
                        ref={svgRef}
                        value={url}
                        size={256}
                        level="H"
                        includeMargin={true}
                    />
                </div>

                <div className="flex flex-col gap-2 mt-2">
                    <p className="text-xs text-center text-muted-foreground break-all mb-2">
                        {url}
                    </p>
                    <Button variant="hero" onClick={downloadQRCode} className="w-full">
                        <Download className="w-4 h-4 mr-2" />
                        Baixar Imagem (PNG)
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
