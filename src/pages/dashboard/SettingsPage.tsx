import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, MapPin, CreditCard, Globe, Save } from 'lucide-react';
import { toast } from 'sonner';
import type { Tenant } from '@shared/types';
export default function SettingsPage() {
  const { slug } = useParams();
  const queryClient = useQueryClient();
  const { data: tenant, isLoading } = useQuery({
    queryKey: ['tenants', slug],
    queryFn: () => api<Tenant>(`/api/tenants/${slug}`)
  });
  const mutation = useMutation({
    mutationFn: (updates: Partial<Tenant>) => api(`/api/${slug}/settings`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants', slug] });
      toast.success('Profil masjid berhasil diperbarui');
    }
  });
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    mutation.mutate(data);
  };
  if (isLoading) return <div className="p-8">Memuat pengaturan...</div>;
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12 space-y-8 animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-display font-bold">Pengaturan Masjid</h1>
          <p className="text-muted-foreground">Sesuaikan identitas digital dan operasional masjid Anda.</p>
        </div>
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="bg-stone-100 p-1 rounded-xl w-full sm:w-auto flex flex-wrap h-auto">
            <TabsTrigger value="general" className="rounded-lg gap-2 flex-1 sm:flex-initial"><Globe className="h-4 w-4" /> Identitas</TabsTrigger>
            <TabsTrigger value="location" className="rounded-lg gap-2 flex-1 sm:flex-initial"><MapPin className="h-4 w-4" /> Lokasi</TabsTrigger>
            <TabsTrigger value="financial" className="rounded-lg gap-2 flex-1 sm:flex-initial"><CreditCard className="h-4 w-4" /> Keuangan</TabsTrigger>
            <TabsTrigger value="security" className="rounded-lg gap-2 flex-1 sm:flex-initial"><Shield className="h-4 w-4" /> Keamanan</TabsTrigger>
          </TabsList>
          <form onSubmit={handleSubmit}>
            <TabsContent value="general" className="space-y-4">
              <Card className="illustrative-card">
                <CardHeader>
                  <CardTitle>Profil Publik</CardTitle>
                  <CardDescription>Informasi ini dapat dilihat pada portal publik masjid Anda.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Masjid</Label>
                    <Input id="name" name="name" defaultValue={tenant?.name} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Tentang / Bio</Label>
                    <Textarea id="bio" name="bio" defaultValue={tenant?.bio} placeholder="Deskripsi singkat masjid Anda..." className="h-32" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="logoUrl">Logo Masjid (URL)</Label>
                    <Input id="logoUrl" name="logoUrl" type="url" defaultValue={tenant?.logoUrl} placeholder="https://example.com/logo.png" />
                    <p className="text-[10px] text-muted-foreground italic">Gunakan URL gambar logo masjid Anda (format: PNG, JPG, SVG)</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bannerUrl">Banner Utama (URL)</Label>
                    <Input id="bannerUrl" name="bannerUrl" type="url" defaultValue={tenant?.bannerUrl} placeholder="https://example.com/banner.jpg" />
                    <p className="text-[10px] text-muted-foreground italic">Gambar banner untuk tampilan utama portal (format: JPG, PNG)</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="runningText">Teks Berjalan</Label>
                    <Input id="runningText" name="runningText" defaultValue={tenant?.runningText} placeholder="Selamat datang di Portal Masjid..." />
                    <p className="text-[10px] text-muted-foreground italic">Teks yang akan muncul di bagian atas portal sebagai pengumuman</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug Unik (URL)</Label>
                    <Input id="slug" value={`masjidhub.com/portal/${tenant?.slug}`} disabled className="bg-stone-50" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="location" className="space-y-4">
              <Card className="illustrative-card">
                <CardHeader>
                  <CardTitle>Lokasi Fisik</CardTitle>
                  <CardDescription>Bantu jamaah menemukan masjid Anda.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Alamat Lengkap</Label>
                    <Textarea id="address" name="address" defaultValue={tenant?.address} placeholder="Jalan, Kota, Provinsi, Kode Pos" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="financial" className="space-y-4">
              <Card className="illustrative-card">
                <CardHeader>
                  <CardTitle>Informasi Keuangan</CardTitle>
                  <CardDescription>Detail bank yang digunakan untuk donasi dan pelacakan infaq.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bankInfo">Detail Rekening Bank</Label>
                    <Textarea id="bankInfo" name="bankInfo" defaultValue={tenant?.bankInfo} placeholder="Mis: Bank Syariah Indonesia, No: 7123456789 a/n Masjid Al-Noor" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="security" className="space-y-4">
              <Card className="illustrative-card">
                <CardHeader>
                  <CardTitle>Keamanan & Akses</CardTitle>
                  <CardDescription>Atur siapa yang dapat mengelola data masjid Anda.</CardDescription>
                </CardHeader>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Pengaturan keamanan tingkat lanjut akan segera hadir.
                </CardContent>
              </Card>
            </TabsContent>
            <div className="mt-8 flex justify-end">
              <Button type="submit" size="lg" className="h-12 px-8 gap-2" disabled={mutation.isPending}>
                <Save className="h-5 w-5" /> {mutation.isPending ? 'Menyimpan...' : 'Simpan Pengaturan'}
              </Button>
            </div>
          </form>
        </Tabs>
      </div>
    </div>
  );
}