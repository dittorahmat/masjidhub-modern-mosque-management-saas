import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  PlusCircle, History, HeartPulse, User, Wallet, 
  FileText, CreditCard, HandCoins, Users, 
  ArrowUpRight, ArrowDownRight, Search, Filter, 
  MoreVertical, CheckCircle2, AlertCircle
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ZisTransaction, Mustahik } from '@shared/types';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale/id';

export default function ZisPage() {
  const { slug } = useParams();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: transactions = [], isLoading: loadingTx } = useQuery({
    queryKey: ['zis', slug],
    queryFn: () => api<ZisTransaction[]>(`/api/${slug}/zis`)
  });

  const { data: mustahik = [], isLoading: loadingMustahik } = useQuery({
    queryKey: ['mustahik', slug],
    queryFn: () => api<Mustahik[]>(`/api/${slug}/mustahik`)
  });

  const totals = transactions.reduce((acc, tx) => {
    if (tx.flow === 'in' && tx.payment_status === 'completed') {
      acc.in[tx.type] = (acc.in[tx.type] || 0) + tx.amount;
      acc.totalIn += tx.amount;
    } else if (tx.flow === 'out') {
      acc.totalOut += tx.amount;
    }
    return acc;
  }, { in: {} as Record<string, number>, totalIn: 0, totalOut: 0 });

  return (
    <div className="space-y-10 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-widest">
            <HandCoins className="h-4 w-4" />
            <span>Amanah Zakat & Infaq</span>
          </div>
          <h1 className="text-4xl font-display font-black tracking-tight">Manajemen <span className="text-emerald-600">ZIS</span></h1>
          <p className="text-muted-foreground text-lg font-medium">Pengelolaan dana ummat yang transparan dan tepat sasaran.</p>
        </div>
        <div className="flex gap-3">
           <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl h-12 px-6 font-bold gap-2 shadow-xl shadow-emerald-200">
                <PlusCircle className="h-4 w-4" /> Catat Penerimaan
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[2rem]">
               <DialogHeader><DialogTitle>Penerimaan ZIS Baru</DialogTitle></DialogHeader>
               <ZisEntryForm type="in" />
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-2xl h-12 px-6 font-bold border-2 gap-2">
                <ArrowDownRight className="h-4 w-4 text-red-500" /> Penyaluran Dana
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[2rem]">
               <DialogHeader><DialogTitle>Salurkan Dana ZIS</DialogTitle></DialogHeader>
               <ZisEntryForm type="out" />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabs System (The ATM Core) */}
      <Tabs defaultValue="overview" className="space-y-8" onValueChange={setActiveTab}>
        <TabsList className="bg-stone-100 p-1.5 rounded-2xl h-auto">
          <TabsTrigger value="overview" className="rounded-xl px-6 py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Ringkasan</TabsTrigger>
          <TabsTrigger value="transactions" className="rounded-xl px-6 py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Riwayat Transaksi</TabsTrigger>
          <TabsTrigger value="mustahik" className="rounded-xl px-6 py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Database Mustahik</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ZisStatCard 
              title="Zakat Terkumpul" 
              value={totals.totalIn} 
              icon={<ArrowUpRight className="text-emerald-500" />} 
              sub="Total saldo masuk"
              color="emerald"
            />
            <ZisStatCard 
              title="Tersalurkan" 
              value={totals.totalOut} 
              icon={<ArrowDownRight className="text-red-500" />} 
              sub={`${((totals.totalOut/totals.totalIn)*100 || 0).toFixed(1)}% dari total`}
              color="amber"
            />
            <ZisStatCard 
              title="Mustahik Terbantu" 
              value={mustahik.filter(m => m.status === 'completed').length} 
              icon={<Users className="text-blue-500" />} 
              sub="Jiwa yang terbantu"
              color="blue"
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-8">
               <CardHeader className="p-0 mb-6 flex flex-row items-center justify-between">
                 <div>
                    <CardTitle className="text-2xl font-bold">Sebaran Asnaf</CardTitle>
                    <CardDescription className="font-medium">Distribusi penerima berdasarkan kategori</CardDescription>
                 </div>
                 <PieChart className="h-6 w-6 text-muted-foreground opacity-20" />
               </CardHeader>
               <div className="space-y-4">
                  {['fakir', 'miskin', 'amil', 'mualaf', 'gharim'].map((cat) => {
                    const count = mustahik.filter(m => m.category === cat).length;
                    const percent = (count / (mustahik.length || 1)) * 100;
                    return (
                      <div key={cat} className="space-y-2">
                         <div className="flex justify-between text-sm font-bold capitalize">
                            <span>{cat}</span>
                            <span>{count} Orang</span>
                         </div>
                         <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${percent}%` }} />
                         </div>
                      </div>
                    );
                  })}
               </div>
            </Card>

            <Card className="rounded-[2.5rem] border-none shadow-sm bg-slate-900 text-white p-8 flex flex-col justify-between">
               <div className="space-y-4">
                  <Badge className="bg-emerald-500 text-black font-black uppercase">Smart Insight</Badge>
                  <h3 className="text-3xl font-bold leading-tight italic">Dana Zakat Maal Anda mencukupi untuk membantu 5 orang Gharim.</h3>
                  <p className="text-slate-400 font-medium">Berdasarkan database mustahik, ada beberapa warga yang membutuhkan bantuan pelunasan utang darurat.</p>
               </div>
               <Button className="w-full rounded-2xl h-14 bg-white text-slate-900 hover:bg-slate-100 font-bold mt-8">
                 Lihat Rekomendasi Penyaluran
               </Button>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
           <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden">
              <div className="p-8 border-b flex justify-between items-center">
                 <h2 className="text-xl font-bold">Log Aktivitas ZIS</h2>
                 <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="rounded-xl h-10 px-4 font-bold border-2"><Filter className="h-4 w-4 mr-2" /> Filter</Button>
                    <Button variant="outline" size="sm" className="rounded-xl h-10 px-4 font-bold border-2"><FileText className="h-4 w-4 mr-2" /> Export</Button>
                 </div>
              </div>
              <Table>
                 <TableHeader className="bg-stone-50">
                    <TableRow className="border-none">
                       <TableHead className="px-8 py-4 font-bold uppercase text-[10px] tracking-widest">Tanggal</TableHead>
                       <TableHead className="py-4 font-bold uppercase text-[10px] tracking-widest">Muzakki / Mustahik</TableHead>
                       <TableHead className="py-4 font-bold uppercase text-[10px] tracking-widest">Tipe & Arah</TableHead>
                       <TableHead className="py-4 font-bold uppercase text-[10px] tracking-widest">Status</TableHead>
                       <TableHead className="py-4 font-bold uppercase text-[10px] tracking-widest text-right px-8">Jumlah</TableHead>
                    </TableRow>
                 </TableHeader>
                 <TableBody>
                    {transactions.map(tx => (
                      <TableRow key={tx.id} className="hover:bg-stone-50 border-stone-100">
                         <TableCell className="px-8 font-medium text-muted-foreground">{format(tx.date, 'dd MMM yyyy')}</TableCell>
                         <TableCell className="font-bold">{tx.muzakki_name || tx.mustahik_id || 'Ummat'}</TableCell>
                         <TableCell>
                            <div className="flex items-center gap-2">
                               <Badge variant="outline" className="capitalize border-primary/20 text-primary">{tx.type.replace('_', ' ')}</Badge>
                               {tx.flow === 'in' ? <ArrowUpRight className="h-3 w-3 text-emerald-500" /> : <ArrowDownRight className="h-3 w-3 text-red-500" />}
                            </div>
                         </TableCell>
                         <TableCell>
                            <Badge className={tx.payment_status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>
                               {tx.payment_status === 'completed' ? 'Selesai' : 'Diproses'}
                            </Badge>
                         </TableCell>
                         <TableCell className={`text-right px-8 font-black ${tx.flow === 'in' ? 'text-emerald-600' : 'text-red-600'}`}>
                            {tx.flow === 'in' ? '+' : '-'}Rp {tx.amount.toLocaleString('id-ID')}
                         </TableCell>
                      </TableRow>
                    ))}
                 </TableBody>
              </Table>
           </Card>
        </TabsContent>

        <TabsContent value="mustahik" className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
           <div className="flex justify-between items-center">
              <div className="relative w-72">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                 <Input className="pl-10 rounded-2xl border-2 h-11" placeholder="Cari Mustahik..." />
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="rounded-2xl h-11 px-6 font-bold shadow-lg shadow-emerald-100">Tambah Mustahik</Button>
                </DialogTrigger>
                <DialogContent className="rounded-[2rem]">
                   <DialogHeader><DialogTitle>Data Mustahik Baru</DialogTitle></DialogHeader>
                   <MustahikForm />
                </DialogContent>
              </Dialog>
           </div>

           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mustahik.map(m => (
                <Card key={m.id} className="rounded-[2rem] border-none shadow-sm bg-white p-6 hover:shadow-md transition-all group">
                   <div className="flex justify-between items-start mb-4">
                      <div className="p-4 bg-stone-100 rounded-2xl group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-all">
                         <User className="h-6 w-6" />
                      </div>
                      <Badge className="bg-slate-900 text-white capitalize">{m.category}</Badge>
                   </div>
                   <h3 className="text-xl font-bold mb-1">{m.name}</h3>
                   <p className="text-sm text-muted-foreground font-medium mb-4">{m.phone || 'No. HP tidak ada'}</p>
                   <div className="pt-4 border-t flex justify-between items-center">
                      <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                         <CheckCircle2 className={`h-4 w-4 ${m.status === 'completed' ? 'text-emerald-500' : 'text-stone-300'}`} />
                         {m.status === 'completed' ? 'Sudah Dibantu' : 'Menunggu'}
                      </div>
                      <Button variant="ghost" size="icon" className="rounded-full"><MoreVertical className="h-4 w-4" /></Button>
                   </div>
                </Card>
              ))}
           </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ZisStatCard({ title, value, icon, sub, color }: any) {
  const colors: any = {
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-blue-50 text-blue-700"
  };
  return (
    <Card className={`rounded-[2rem] border-none shadow-sm p-8 ${colors[color]}`}>
       <div className="flex justify-between items-start mb-6">
          <div className="p-3 bg-white/50 rounded-2xl">
             {icon}
          </div>
          <p className="text-xs font-black uppercase tracking-widest opacity-60">{title}</p>
       </div>
       <div className="space-y-1">
          <p className="text-3xl font-black tracking-tight">Rp {value.toLocaleString('id-ID')}</p>
          <p className="text-xs font-bold opacity-70">{sub}</p>
       </div>
    </Card>
  );
}

function ZisEntryForm({ type }: { type: 'in' | 'out' }) {
  return (
    <form className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label>Tipe ZIS</Label>
        <Select name="type" defaultValue="zakat_fitrah">
          <SelectTrigger className="h-12 rounded-xl border-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="zakat_fitrah">Zakat Fitrah</SelectItem>
            <SelectItem value="zakat_maal">Zakat Maal</SelectItem>
            <SelectItem value="fidyah">Fidyah</SelectItem>
            <SelectItem value="infaq_shadaqah">Infaq & Shadaqah</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>{type === 'in' ? 'Nama Muzakki' : 'Pilih Mustahik'}</Label>
        <Input name="name" required placeholder={type === 'in' ? "Hamba Allah" : "Pilih dari database"} className="h-12 rounded-xl border-2" />
      </div>
      <div className="space-y-2">
        <Label>Jumlah (Rp)</Label>
        <Input name="amount" type="number" required placeholder="0" className="h-12 rounded-xl border-2" />
      </div>
      <div className="space-y-2">
        <Label>Keterangan</Label>
        <Input name="description" placeholder="Contoh: Zakat Maal periode 2024" className="h-12 rounded-xl border-2" />
      </div>
      <Button type="submit" className="w-full h-14 text-lg rounded-2xl font-bold bg-emerald-600 hover:bg-emerald-700 mt-4">
        Simpan Data
      </Button>
    </form>
  );
}

function MustahikForm() {
  return (
    <form className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label>Nama Lengkap</Label>
        <Input name="name" required placeholder="Nama Mustahik" className="h-12 rounded-xl border-2" />
      </div>
      <div className="space-y-2">
        <Label>Kategori Asnaf</Label>
        <Select name="category" defaultValue="miskin">
          <SelectTrigger className="h-12 rounded-xl border-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fakir">Fakir</SelectItem>
            <SelectItem value="miskin">Miskin</SelectItem>
            <SelectItem value="amil">Amil</SelectItem>
            <SelectItem value="mualaf">Mualaf</SelectItem>
            <SelectItem value="gharim">Gharim</SelectItem>
            <SelectItem value="fisabilillah">Fisabilillah</SelectItem>
            <SelectItem value="ibnu_sabil">Ibnu Sabil</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Nomor WhatsApp</Label>
        <Input name="phone" placeholder="0812..." className="h-12 rounded-xl border-2" />
      </div>
      <div className="space-y-2">
        <Label>Alamat</Label>
        <Input name="address" placeholder="Alamat lengkap" className="h-12 rounded-xl border-2" />
      </div>
      <Button type="submit" className="w-full h-14 text-lg rounded-2xl font-bold bg-primary mt-4">
        Daftarkan Mustahik
      </Button>
    </form>
  );
}

function PieChart(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  );
}
