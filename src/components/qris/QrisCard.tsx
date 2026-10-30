import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink, Check } from 'lucide-react';
import type { Tenant } from '@shared/types';

interface QrisCardProps {
  tenant?: Tenant;
  qrisUrl: string;
  onDownload: () => void;
}

export const QrisCard: React.FC<QrisCardProps> = ({
  tenant,
  qrisUrl,
  onDownload,
}) => {
  return (
    <div className="w-full max-w-md bg-white rounded-[2.5rem] border-2 border-stone-200 shadow-xl overflow-hidden relative">
      {/* QRIS Indonesia Header Standard */}
      <div className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between border-b border-stone-800">
        <div className="flex items-center gap-3">
          <div className="bg-red-600 text-white font-black px-2 py-0.5 rounded text-xs tracking-wider font-mono">
            QRIS
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold tracking-wider uppercase text-stone-200">
              QR Standar Indonesia
            </span>
            <span className="text-[10px] text-stone-400">Pembayaran Digital Cepat & Aman</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded-md text-[10px] font-bold text-emerald-400 border border-white/10">
          <Check className="h-3 w-3" />
          <span>Terverifikasi</span>
        </div>
      </div>

      {/* Merchant Mosque Title */}
      <div className="p-6 text-center border-b border-stone-100 bg-stone-50/50">
        <Badge
          variant="outline"
          className="mb-2 bg-emerald-50 text-emerald-700 border-emerald-200 font-bold text-[10px] uppercase tracking-wider"
        >
          Infaq & Shadaqah
        </Badge>
        <h2 className="text-xl font-display font-black text-stone-900">
          {tenant?.name || 'Masjid Al-Hikmah'}
        </h2>
        <p className="text-xs text-stone-500 mt-1">
          {tenant?.city ? `Kota ${tenant.city}` : 'Indonesia'} • NMID: ID1020002938472
        </p>
      </div>

      {/* Barcode Frame */}
      <div className="p-8 flex flex-col items-center justify-center bg-white">
        <div className="w-64 h-64 md:w-72 md:h-72 p-3 bg-white rounded-3xl border-2 border-stone-200 shadow-inner flex items-center justify-center relative group">
          <img
            src={qrisUrl}
            alt={`QRIS ${tenant?.name || 'Masjid'}`}
            className="w-full h-full object-contain rounded-2xl group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Supported payment apps footer */}
        <div className="mt-6 w-full text-center">
          <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-2">
            Dapat dipindai melalui semua aplikasi
          </p>
          <div className="flex flex-wrap justify-center items-center gap-2 text-[10px] font-bold text-stone-600 bg-stone-50 py-2.5 px-4 rounded-xl border border-stone-100">
            <span className="text-emerald-700">BSI Mobile</span> •
            <span className="text-blue-700">BCA</span> •
            <span className="text-sky-600">Mandiri</span> •
            <span className="text-orange-600">BNI</span> •
            <span className="text-green-600">GoPay</span> •
            <span className="text-purple-600">OVO</span> •
            <span className="text-blue-500">DANA</span> •
            <span className="text-red-600">LinkAja</span>
          </div>
        </div>
      </div>

      {/* Card Actions */}
      <div className="p-6 bg-stone-50 border-t border-stone-100 flex flex-col sm:flex-row gap-3">
        <Button
          onClick={onDownload}
          className="flex-1 rounded-2xl h-11 bg-stone-900 hover:bg-stone-800 text-white font-bold gap-2 text-xs"
        >
          <Download className="h-4 w-4" />
          Simpan Gambar QRIS
        </Button>
        {tenant?.slug && (
          <Button
            variant="outline"
            asChild
            className="rounded-2xl h-11 border-stone-200 hover:bg-white text-xs font-bold gap-2"
          >
            <Link to={`/portal/${tenant.slug}`} target="_blank">
              <ExternalLink className="h-4 w-4" />
              Portal Publik
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
};
