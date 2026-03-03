import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Save, 
  Settings, 
  MapPin, 
  Building2, 
  Globe, 
  CreditCard, 
  Sparkles,
  Search,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import type { Tenant } from '@shared/types';

export default function SettingsPage() {
  const { slug } = useParams();
  const queryClient = useQueryClient();
  const [geoQuery, setGeoQuery] = useState('');
  const [geoResults, setGeoResults] = useState<any[]>([]);
  const [isSearchingGeo, setIsSearchingGeo] = useState(false);

  const { data: tenant, isLoading } = useQuery({
    queryKey: ['tenants', slug],
    queryFn: () => api<Tenant>(`/api/tenants/${slug}`)
  });

  const mutation = useMutation({
    mutationFn: (updatedTenant: Partial<Tenant>) => api(`/api/${slug}/settings`, {
      method: 'PUT',
      body: JSON.stringify(updatedTenant)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants', slug] });
      toast.success('Pengaturan berhasil diperbarui');
    },
    onError: () => toast.error('Gagal memperbarui pengaturan')
  });

  const searchGeo = async () => {
    if (!geoQuery.trim()) return;
    setIsSearchingGeo(true);
    try {
      const results = await api<any[]>(`/api/geo/search?q=${encodeURIComponent(geoQuery)}`);
      setGeoResults(results);
    } catch (e) {
      toast.error('Gagal mencari kota');
    } finally {
      setIsSearchingGeo(false);
    }
  };

  const handleSelectLocation = (res: any) => {
    // Basic mapping from Nominatim result
    const city = res.display_name.split(',')[0];
    const lat = parseFloat(res.lat);
    const lon = parseFloat(res.lon);
    
    mutation.mutate({ 
      city, 
      latitude: lat, 
      longitude: lon,
      address: res.display_name
    });
    
    setGeoResults([]);
    setGeoQuery(city);
    toast.success(`Lokasi disetel ke ${city}`);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    mutation.mutate({
      name: data.name as string,
      runningText: data.runningText as string,
      bankInfo: data.bankInfo as string,
      bio: data.bio as string,
      aiEnabled: data.aiEnabled === 'on',
    });
  };

  if (isLoading) return <div className="p-8">Memuat pengaturan...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display font-bold text-stone-800">Pengaturan Masjid</h1>
        <p className="text-muted-foreground text-sm">Kelola profil, lokasi, dan konfigurasi platform.</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-stone-100/50 p-1 rounded-xl">
          <TabsTrigger value="general" className="rounded-lg gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Building2 className="h-4 w-4" /> Informasi Umum
          </TabsTrigger>
          <TabsTrigger value="location" className="rounded-lg gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <MapPin className="h-4 w-4" /> Lokasi & Jadwal Shalat
          </TabsTrigger>
          <TabsTrigger value="finance" className="rounded-lg gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <CreditCard className="h-4 w-4" /> Rekening & ZIS
          </TabsTrigger>
        </TabsList>

        <form onSubmit={handleSubmit}>
          <TabsContent value="general" className="space-y-6 mt-0">
            <Card className="rounded-3xl border-stone-200 shadow-sm overflow-hidden">
              <CardHeader className="bg-stone-50/50 border-b">
                <CardTitle className="text-sm font-bold">Profil Masjid</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nama Masjid</Label>
                  <Input id="name" name="name" defaultValue={tenant?.name} className="rounded-xl" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bio">Bio / Deskripsi Singkat</Label>
                  <Textarea id="bio" name="bio" defaultValue={tenant?.bio} className="rounded-xl min-h-[100px]" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="runningText">Running Text (Pengumuman)</Label>
                  <Input id="runningText" name="runningText" defaultValue={tenant?.runningText} className="rounded-xl" />
                </div>
                <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-100 mt-4">
                  <div className="space-y-0.5">
                    <Label className="text-emerald-900 font-bold">Aktifkan Fitur AI</Label>
                    <p className="text-[10px] text-emerald-700">Gunakan asisten digital untuk menjawab jamaah.</p>
                  </div>
                  <Switch name="aiEnabled" defaultChecked={tenant?.aiEnabled} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="location" className="space-y-6 mt-0">
            <Card className="rounded-3xl border-stone-200 shadow-sm overflow-hidden">
              <CardHeader className="bg-stone-50/50 border-b">
                <CardTitle className="text-sm font-bold">Lokasi & Geocoding</CardTitle>
                <CardDescription className="text-xs">Atur lokasi untuk otomasi jadwal shalat.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                      <Input 
                        placeholder="Cari Kota (e.g. Jakarta Selatan)" 
                        className="pl-9 rounded-xl"
                        value={geoQuery}
                        onChange={(e) => setGeoQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchGeo())}
                      />
                    </div>
                    <Button type="button" variant="secondary" onClick={searchGeo} disabled={isSearchingGeo} className="rounded-xl">
                      {isSearchingGeo ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cari"}
                    </Button>
                  </div>

                  {geoResults.length > 0 && (
                    <div className="border rounded-2xl overflow-hidden divide-y bg-white shadow-lg">
                      {geoResults.map((res, i) => (
                        <button
                          key={i}
                          type="button"
                          className="w-full text-left p-3 hover:bg-emerald-50 text-xs flex items-start gap-3 transition-colors"
                          onClick={() => handleSelectLocation(res)}
                        >
                          <MapPin className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                          <span>{res.display_name}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-dashed">
                    <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                      <Label className="text-[10px] uppercase text-stone-400 font-bold">Kota Terdaftar</Label>
                      <p className="text-sm font-bold text-stone-800">{tenant?.city || 'Belum diatur'}</p>
                    </div>
                    <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                      <Label className="text-[10px] uppercase text-stone-400 font-bold">Koordinat</Label>
                      <p className="text-xs font-mono text-stone-600">
                        {tenant?.latitude ? `${tenant.latitude.toFixed(4)}, ${tenant.longitude?.toFixed(4)}` : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="finance" className="space-y-6 mt-0">
            <Card className="rounded-3xl border-stone-200 shadow-sm overflow-hidden">
              <CardHeader className="bg-stone-50/50 border-b">
                <CardTitle className="text-sm font-bold">Informasi Rekening</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="bankInfo">Detail Bank (Muncul di Portal)</Label>
                  <Textarea id="bankInfo" name="bankInfo" defaultValue={tenant?.bankInfo} placeholder="Contoh: BSI 7123456789 a/n Masjid Al-Hikmah" className="rounded-xl" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <div className="flex justify-end pt-4">
            <Button type="submit" size="lg" className="rounded-2xl px-8 bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-600/20" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Simpan Semua Perubahan
            </Button>
          </div>
        </form>
      </Tabs>
    </div>
  );
}
