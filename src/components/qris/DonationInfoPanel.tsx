import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Heart, Building, Copy, Check, CreditCard, Sparkles, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import type { Tenant } from '@shared/types';

const NOMINAL_RECOMMENDATIONS = [
  { label: 'Rp 10.000', value: 10000, desc: 'Infaq Subuh / Harian' },
  { label: 'Rp 25.000', value: 25000, desc: 'Infaq Jumat Berkah' },
  { label: 'Rp 50.000', value: 50000, desc: 'Sedekah Operasional' },
  { label: 'Rp 100.000', value: 100000, desc: 'Donasi Program Dakwah' },
  { label: 'Rp 500.000', value: 500000, desc: 'Pahala Jariyah Ummat' },
];

interface DonationInfoPanelProps {
  tenant?: Tenant;
  slug?: string;
  isAdmin: boolean;
}

export const DonationInfoPanel: React.FC<DonationInfoPanelProps> = ({
  tenant,
  slug,
  isAdmin,
}) => {
  const [selectedNominal, setSelectedNominal] = useState<number | null>(null);
  const [customNominal, setCustomNominal] = useState<string>('');
  const [copiedBank, setCopiedBank] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBank(label);
    toast.success(`${label} berhasil disalin ke clipboard!`);
    setTimeout(() => setCopiedBank(null), 2500);
  };

  const currentActiveNominal =
    selectedNominal !== null
      ? selectedNominal
      : customNominal
      ? parseInt(customNominal.replace(/\D/g, ''), 10) || 0
      : 0;

  return (
    <div className="space-y-6">
      {/* Quick Nominal Calculator */}
      <Card className="rounded-3xl border-stone-200 shadow-sm overflow-hidden bg-white">
        <CardHeader className="bg-stone-50/70 border-b border-stone-100 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-stone-800 flex items-center gap-2">
                <Heart className="h-4 w-4 text-rose-500 fill-rose-500" />
                Pilihan Cepat Nominal Infaq
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Pilih besaran nominal yang ingin disalurkan sebelum memindai QRIS.
              </CardDescription>
            </div>
            <Badge variant="secondary" className="font-bold text-xs bg-emerald-100 text-emerald-800">
              Sukarela
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {NOMINAL_RECOMMENDATIONS.map((rec) => {
              const isSelected = selectedNominal === rec.value;
              return (
                <button
                  key={rec.value}
                  type="button"
                  onClick={() => {
                    setSelectedNominal(isSelected ? null : rec.value);
                    setCustomNominal('');
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                      : 'border-stone-200 hover:border-emerald-300 hover:bg-stone-50'
                  }`}
                >
                  <p className={`text-sm font-black ${isSelected ? 'text-emerald-800' : 'text-stone-800'}`}>
                    {rec.label}
                  </p>
                  <p className="text-[10px] text-stone-500 mt-1 leading-tight">{rec.desc}</p>
                </button>
              );
            })}
          </div>

          {/* Custom Input */}
          <div className="pt-2">
            <Label htmlFor="customInfaq" className="text-xs font-bold text-stone-700">
              Atau Masukkan Nominal Khusus (Rp)
            </Label>
            <div className="mt-1.5 relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-stone-400">
                Rp
              </span>
              <Input
                id="customInfaq"
                type="text"
                placeholder="Contoh: 150.000"
                value={customNominal}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '');
                  setCustomNominal(raw ? parseInt(raw, 10).toLocaleString('id-ID') : '');
                  setSelectedNominal(null);
                }}
                className="pl-10 rounded-xl font-bold text-stone-900 h-11"
              />
            </div>
          </div>

          {currentActiveNominal > 0 && (
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">
                  Nominal Niat Infaq
                </span>
                <p className="text-lg font-black text-emerald-900">
                  Rp {currentActiveNominal.toLocaleString('id-ID')}
                </p>
              </div>
              <Badge className="bg-emerald-600 text-white font-bold text-xs px-3 py-1">
                Bismillah
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bank Accounts Section */}
      <Card className="rounded-3xl border-stone-200 shadow-sm overflow-hidden bg-white">
        <CardHeader className="bg-stone-50/70 border-b border-stone-100 pb-4">
          <CardTitle className="text-base font-bold text-stone-800 flex items-center gap-2">
            <Building className="h-4 w-4 text-emerald-600" />
            Transfer Antar Bank Rekening Masjid
          </CardTitle>
          <CardDescription className="text-xs">
            Alternatif donasi melalui transfer via ATM atau Mobile Banking.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {tenant?.bankAccounts && tenant.bankAccounts.length > 0 ? (
            <div className="space-y-3">
              {tenant.bankAccounts.map((acc, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between group hover:border-emerald-300 transition-colors"
                >
                  <div className="space-y-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-stone-800">{acc.bankName}</span>
                      {acc.isPrimary && (
                        <Badge className="text-[9px] bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none font-bold">
                          Utama
                        </Badge>
                      )}
                    </div>
                    <code className="text-base font-mono font-black text-stone-900 block tracking-wider">
                      {acc.accountNumber}
                    </code>
                    <p className="text-xs text-stone-500">a.n. {acc.holderName}</p>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(acc.accountNumber, `Rekening ${acc.bankName}`)}
                    className="rounded-xl h-9 px-3 border-stone-200 group-hover:border-emerald-400 gap-1.5 shrink-0"
                  >
                    {copiedBank === `Rekening ${acc.bankName}` ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-xs text-emerald-600 font-bold">Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-stone-500" />
                        <span className="text-xs font-semibold">Salin</span>
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          ) : tenant?.bankInfo ? (
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                  Informasi Rekening
                </span>
                <p className="text-sm font-semibold text-stone-800 whitespace-pre-line">
                  {tenant.bankInfo}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCopy(tenant.bankInfo || '', 'Informasi Bank')}
                className="rounded-xl h-9 px-3 border-stone-200 gap-1.5 shrink-0"
              >
                {copiedBank === 'Informasi Bank' ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-xs text-emerald-600 font-bold">Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-stone-500" />
                    <span className="text-xs font-semibold">Salin</span>
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="p-6 text-center border-2 border-dashed border-stone-200 rounded-2xl">
              <CreditCard className="h-8 w-8 text-stone-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-stone-600">Belum ada data rekening bank yang disimpan.</p>
              <p className="text-[11px] text-stone-400 mt-0.5">
                Anda dapat melengkapi rekening di menu Pengaturan Masjid.
              </p>
              {isAdmin && (
                <Button variant="link" asChild className="text-xs text-emerald-600 mt-1 font-bold p-0">
                  <Link to={`/app/${slug}/settings`}>Buka Pengaturan Rekening →</Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Link to ZIS Payment Record */}
      <div className="p-5 bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl text-white shadow-lg shadow-emerald-700/10 flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="font-bold text-sm flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-emerald-200" />
            Catat Transaksi ZIS Masuk?
          </h3>
          <p className="text-xs text-emerald-100 leading-relaxed">
            Amil atau Admin dapat langsung membukukan penerimaan zakat, infaq, atau fidyah ke pembukuan resmi.
          </p>
        </div>
        <Button
          asChild
          className="bg-white text-emerald-800 hover:bg-emerald-50 rounded-2xl h-10 px-4 font-bold text-xs shrink-0 shadow-sm"
        >
          <Link to={`/app/${slug}/zis/payment`}>
            <Wallet className="h-3.5 w-3.5 mr-1.5" />
            Buka Form ZIS
          </Link>
        </Button>
      </div>
    </div>
  );
};
