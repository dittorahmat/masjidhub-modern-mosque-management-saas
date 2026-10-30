import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Download, Copy, Check, QrCode, Heart, Sparkles, Building2
} from 'lucide-react';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
} from '@/components/ui/responsive-dialog';
import type { Tenant } from '@shared/types';
import { toast } from 'sonner';

const PRESET_AMOUNTS = [
  { label: 'Rp 10.000', value: 10000 },
  { label: 'Rp 25.000', value: 25000 },
  { label: 'Rp 50.000', value: 50000 },
  { label: 'Rp 100.000', value: 100000 },
  { label: 'Rp 250.000', value: 250000 },
  { label: 'Rp 500.000', value: 500000 },
];

interface PublicDonationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant: Tenant;
  qrisUrl: string;
  onDownloadQris: () => void;
  onCopyBank: () => void;
  copied: boolean;
}

export function PublicDonationDialog({
  open,
  onOpenChange,
  tenant,
  qrisUrl,
  onDownloadQris,
  onCopyBank,
  copied,
}: PublicDonationDialogProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(50000);
  const [customAmount, setCustomAmount] = useState<string>('');

  const activeAmount = customAmount ? parseInt(customAmount.replace(/\D/g, ''), 10) || 0 : selectedAmount;

  const handleSelectPreset = (val: number) => {
    setSelectedAmount(val);
    setCustomAmount('');
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    setCustomAmount(raw ? `Rp ${parseInt(raw, 10).toLocaleString('id-ID')}` : '');
    setSelectedAmount(null);
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="rounded-3xl border-none p-5 sm:p-7 max-w-md bg-white">
        <ResponsiveDialogHeader className="text-center sm:text-center space-y-2">
          <div className="mx-auto w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <Heart className="h-5 w-5 fill-primary" />
          </div>
          <ResponsiveDialogTitle className="text-xl sm:text-2xl font-display font-bold">
            Donasi & Infaq Masjid
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription className="text-xs sm:text-sm font-medium text-muted-foreground">
            Pindai QRIS resmi dengan m-Banking atau e-Wallet (BCA, Mandiri, BSI, GoPay, OVO, ShopeePay, Dana).
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="space-y-5 pt-2">
          {/* Preset Nominal Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <Label className="font-bold text-slate-700">Pilih Nominal Infaq</Label>
              {activeAmount && activeAmount > 0 ? (
                <span className="tabular-nums font-bold text-primary">
                  Rp {activeAmount.toLocaleString('id-ID')}
                </span>
              ) : null}
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {PRESET_AMOUNTS.map((preset) => {
                const isSelected = selectedAmount === preset.value && !customAmount;
                return (
                  <Button
                    key={preset.value}
                    type="button"
                    variant={isSelected ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleSelectPreset(preset.value)}
                    className={`min-h-[44px] text-xs font-bold rounded-xl transition-all ${
                      isSelected
                        ? 'bg-primary text-white shadow-sm ring-2 ring-primary/20'
                        : 'border-stone-200 text-slate-700 hover:bg-stone-50'
                    }`}
                  >
                    {preset.label}
                  </Button>
                );
              })}
            </div>

            <div className="pt-1">
              <Input
                placeholder="Atau masukkan nominal lain..."
                value={customAmount}
                onChange={handleCustomChange}
                className="min-h-[44px] rounded-xl text-sm font-semibold border-stone-200"
                inputMode="numeric"
              />
            </div>
          </div>

          {/* QRIS Display Container */}
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center text-center">
            <div className="w-48 h-48 sm:w-52 sm:h-52 bg-white p-2 rounded-xl shadow-sm border border-stone-100 flex items-center justify-center">
              <img 
                src={qrisUrl} 
                alt={`QRIS ${tenant.name}`} 
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
            <p className="mt-2.5 font-display font-bold text-sm sm:text-base text-slate-800 line-clamp-1">{tenant.name}</p>
            <p className="text-[11px] text-muted-foreground">NMID: Standar QRIS Pembayaran Nasional</p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              onClick={onDownloadQris}
              variant="outline" 
              className="flex-1 min-h-[44px] rounded-xl font-bold gap-2 text-xs sm:text-sm border-stone-200 hover:bg-stone-50"
            >
              <Download className="h-4 w-4 text-primary" /> Unduh Gambar QRIS
            </Button>
          </div>

          {/* Bank Info Fallback */}
          <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-stone-500" /> Transfer Rekening Manual
              </span>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={onCopyBank}
                className="min-h-[36px] text-xs px-2 gap-1 font-bold text-primary hover:bg-primary/5"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Tersalin" : "Salin No. Rekening"}
              </Button>
            </div>
            <p className="text-xs sm:text-sm tabular-nums font-bold text-slate-800 break-words">
              {tenant.bankInfo || "Bank Syariah Indonesia (BSI) - Konfirmasi ke Pengurus DKM"}
            </p>
            {tenant.bankAccounts && tenant.bankAccounts.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-stone-200">
                {tenant.bankAccounts.map((acc, idx) => (
                  <div key={idx} className="text-[11px] flex justify-between text-slate-600">
                    <span className="font-semibold">{acc.bankName}: {acc.accountNumber}</span>
                    <span className="text-muted-foreground">a.n. {acc.holderName}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
