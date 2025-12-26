import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HeartPulse, PlusCircle, History, TrendingUp, Users } from 'lucide-react';
import { motion } from 'framer-motion';
export default function ZisPage() {
  const { slug } = useParams();
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12 space-y-8 animate-fade-in-up">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Modul ZIS</h1>
            <p className="text-muted-foreground">Pengelolaan Zakat, Infaq, dan Shadaqah yang amanah.</p>
          </div>
          <div className="flex gap-2">
            <Button className="gap-2 rounded-xl">
              <PlusCircle className="h-4 w-4" /> Penerimaan ZIS
            </Button>
            <Button variant="outline" className="gap-2 rounded-xl">
              <History className="h-4 w-4" /> Riwayat
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="illustrative-card bg-emerald-50 border-emerald-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-emerald-800 uppercase tracking-wider">Zakat Fitrah</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-display font-bold text-emerald-900">Rp 4.250.000</div>
              <p className="text-xs text-emerald-700 mt-1">Terkumpul dari 120 Muzakki</p>
            </CardContent>
          </Card>
          <Card className="illustrative-card bg-amber-50 border-amber-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-amber-800 uppercase tracking-wider">Zakat Maal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-display font-bold text-amber-900">Rp 12.800.000</div>
              <p className="text-xs text-amber-700 mt-1">Terkumpul bulan ini</p>
            </CardContent>
          </Card>
          <Card className="illustrative-card bg-blue-50 border-blue-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-blue-800 uppercase tracking-wider">Mustahik Aktif</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-display font-bold text-blue-900">45</div>
              <p className="text-xs text-blue-700 mt-1">Penerima manfaat terdaftar</p>
            </CardContent>
          </Card>
        </div>
        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="illustrative-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Daftar Mustahik (Penerima)
              </CardTitle>
            </CardHeader>
            <CardContent className="py-20 text-center opacity-50">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="font-display text-lg">Belum ada penyaluran hari ini.</p>
              <Button variant="link" className="text-primary font-bold">Daftarkan Mustahik Baru</Button>
            </CardContent>
          </Card>
          <Card className="illustrative-card bg-stone-50/50">
            <CardHeader>
              <CardTitle>Panduan Amil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-white rounded-xl border-2 border-dashed border-stone-200">
                <h4 className="font-bold text-sm mb-1">Verifikasi Muzakki</h4>
                <p className="text-xs text-muted-foreground">Pastikan data muzakki (nama, alamat, email) tercatat dengan benar untuk pengiriman sertifikat donasi.</p>
              </div>
              <div className="p-4 bg-white rounded-xl border-2 border-dashed border-stone-200">
                <h4 className="font-bold text-sm mb-1">Akad Zakat</h4>
                <p className="text-xs text-muted-foreground">Pastikan amil membacakan doa setelah menerima zakat dari muzakki.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}