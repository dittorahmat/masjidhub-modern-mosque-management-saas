import React, { useState, useEffect, useRef } from 'react';
import { ResponsiveDialog, ResponsiveDialogContent, ResponsiveDialogHeader, ResponsiveDialogTitle } from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { Camera, Flashlight, RefreshCw, X, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface MobileQrScannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  onScanSuccess?: (decodedText: string) => void;
}

export function MobileQrScannerModal({
  open,
  onOpenChange,
  title = "Pindai QR Presensi / Infaq",
  onScanSuccess,
}: MobileQrScannerModalProps) {
  const [torchOn, setTorchOn] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [scanning, setScanning] = useState(true);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!open) {
      stopCamera();
      setScannedResult(null);
      setScanning(true);
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [open]);

  const startCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setCameraActive(true);
      }
    } catch {
      // Silently fall back to interactive mock target on browsers without camera permissions
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setTorchOn(false);
  };

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track) {
      try {
        const capabilities = track.getCapabilities ? (track.getCapabilities() as Record<string, unknown>) : {};
        if ('torch' in capabilities) {
          await track.applyConstraints({
            advanced: [{ torch: !torchOn } as MediaTrackConstraintSet]
          });
          setTorchOn(!torchOn);
        } else {
          toast.info("Lampu kilat tidak didukung pada browser/perangkat ini.");
        }
      } catch {
        toast.info("Gagal mengaktifkan senter.");
      }
    }
  };

  const simulateSuccessScan = (sampleCode: string = "REG-JAMAAH-8912") => {
    setScanning(false);
    setScannedResult(sampleCode);
    toast.success(`QR Berhasil Terpindai: ${sampleCode}`);
    if (onScanSuccess) {
      onScanSuccess(sampleCode);
    }
    setTimeout(() => {
      onOpenChange(false);
    }, 1200);
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="p-0 overflow-hidden sm:max-w-md bg-stone-950 text-white border-stone-800">
        <ResponsiveDialogHeader className="p-4 bg-stone-900 border-b border-stone-800 flex flex-row items-center justify-between">
          <ResponsiveDialogTitle className="text-base text-white font-bold flex items-center gap-2">
            <Camera className="h-5 w-5 text-emerald-400" />
            {title}
          </ResponsiveDialogTitle>
        </ResponsiveDialogHeader>

        <div className="relative w-full aspect-square bg-black flex items-center justify-center overflow-hidden">
          {cameraActive ? (
            <video
              ref={videoRef}
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="text-center p-6 space-y-3 z-10">
              <Camera className="h-12 w-12 mx-auto text-stone-600 animate-pulse" />
              <p className="text-xs text-stone-400">
                Arahkan kamera smartphone ke QR Code tanda pengenal jamaah
              </p>
            </div>
          )}

          {/* Scanner Targeting Frame Overlay */}
          <div className="absolute inset-8 border-2 border-emerald-400/80 rounded-2xl pointer-events-none flex flex-col justify-between p-2 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
            <div className="flex justify-between">
              <div className="w-6 h-6 border-t-4 border-l-4 border-emerald-400 -mt-2 -ml-2 rounded-tl-lg" />
              <div className="w-6 h-6 border-t-4 border-r-4 border-emerald-400 -mt-2 -mr-2 rounded-tr-lg" />
            </div>
            {scanning && (
              <div className="w-full h-0.5 bg-emerald-400 shadow-[0_0_12px_#34d399] animate-bounce" />
            )}
            <div className="flex justify-between">
              <div className="w-6 h-6 border-b-4 border-l-4 border-emerald-400 -mb-2 -ml-2 rounded-bl-lg" />
              <div className="w-6 h-6 border-b-4 border-r-4 border-emerald-400 -mb-2 -mr-2 rounded-br-lg" />
            </div>
          </div>

          {scannedResult && (
            <div className="absolute inset-0 bg-emerald-950/90 flex flex-col items-center justify-center p-6 text-center space-y-2 z-20 animate-fade-in">
              <CheckCircle2 className="h-14 w-14 text-emerald-400 animate-scale-up" />
              <p className="font-bold text-lg text-emerald-200">Presensi Berhasil!</p>
              <p className="font-mono text-xs text-emerald-300">{scannedResult}</p>
            </div>
          )}
        </div>

        {/* Bottom Control Bar */}
        <div className="p-4 bg-stone-900 border-t border-stone-800 flex items-center justify-between pb-safe">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleTorch}
            className={`min-h-[44px] min-w-[44px] rounded-full text-xs gap-1.5 ${
              torchOn ? "bg-amber-500/20 text-amber-400" : "text-stone-300 hover:text-white"
            }`}
          >
            <Flashlight className="h-4 w-4" />
            {torchOn ? "Lampu Nyala" : "Senter"}
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => simulateSuccessScan()}
            className="min-h-[44px] rounded-full px-5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-1.5 shadow-lg shadow-emerald-900/30"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Simulasi Scan
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="min-h-[44px] min-w-[44px] rounded-full text-xs text-stone-300 hover:text-white"
          >
            <X className="h-4 w-4" />
            Tutup
          </Button>
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
