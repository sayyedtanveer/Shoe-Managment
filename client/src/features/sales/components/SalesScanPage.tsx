import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';

export function SalesScanPage() {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (!containerRef.current) return;
        const elementId = 'shoeflow-qr-region';
        containerRef.current.id = elementId;

        const html5QrCode = new Html5Qrcode(elementId);

        html5QrCode
            .start(
                { facingMode: 'environment' },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                },
                (decodedText) => {
                    html5QrCode.stop().catch(() => {});
                    navigate(`/sales/product/${encodeURIComponent(decodedText)}`);
                },
                () => {}
            )
            .catch(() => {
                // ignore start errors for now
            });

        return () => {
            html5QrCode.stop().catch(() => {});
            html5QrCode.clear();
        };
    }, [navigate]);

    return (
        <div className="flex flex-col h-full">
            <div className="p-4">
                <h1 className="text-xl font-semibold mb-2">Scan product</h1>
                <p className="text-sm text-gray-400">
                    Align the QR code within the frame.
                </p>
            </div>
            <div className="flex-1 flex items-center justify-center">
                <div
                    ref={containerRef}
                    className="w-72 h-72 bg-black/80 rounded-2xl overflow-hidden"
                />
            </div>
        </div>
    );
}

