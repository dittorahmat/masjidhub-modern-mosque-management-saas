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
  MoreVertical, CheckCircle2, AlertCircle, ChevronRight, Sparkles
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
import { motion, AnimatePresence } from 'framer-motion';

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
    <div className="space-y-12 pb-10">
      {/* Refined Header (Standardized with Overview) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-stone-200/60 pb-10"
      >
        <div className="space-y-4">
          <nav className="flex items-center gap-2 text-muted-foreground/60 font-bold text-[10px] uppercase tracking-[0.3em]">
            <HandCoins className="h-3 w-3 text-emerald-500/40" />
            <span>Manajemen Keuangan</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-emerald-600/60">Modul ZIS</span>
          </nav>
          
          <div className="space-y-2">
            <h1 className="text-5xl md:text-6xl font-display font-black tracking-tighter italic leading-none">
              Amanah <span className="text-emerald-600">Zakat & Infaq</span>
            </h1>
            <p className="text-muted-foreground text-xl font-medium max-w-2xl">
              Pengelolaan dana ummat yang <span className="text-foreground font-bold underline decoration-emerald-200 underline-offset-4">transparan</span> dan tepat sasaran.
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4">
           <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full h-14 px-8 font-bold gap-3 shadow-xl shadow-emerald-200/50 text-base">
                <PlusCircle className="h-5 w-5" /> Catat Penerimaan
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[2.5rem] illustrative-card p-10">
               <DialogHeader><DialogTitle className="text-3xl font-display font-bold">Penerimaan ZIS Baru</DialogTitle></DialogHeader>
               <ZisEntryForm type="in" />
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-full h-14 px-8 font-bold border-2 gap-3 text-base shadow-sm hover:shadow-md transition-all">
                <ArrowDownRight className="h-5 w-5 text-red-500" /> Penyaluran Dana
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[2.5rem] illustrative-card p-10">
               <DialogHeader><DialogTitle className="text-3xl font-display font-bold">Salurkan Dana ZIS</DialogTitle></DialogHeader>
               <ZisEntryForm type="out" />
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Tabs System (Standardized with Warm Stone Palette) */}
      <Tabs defaultValue="overview" className="space-y-10" onValueChange={setActiveTab}>
        <TabsList className="bg-stone-100/80 backdrop-blur-sm p-1.5 rounded-2xl h-auto border-2 border-stone-200/40">
          <TabsTrigger value="overview" className="rounded-xl px-8 py-3 font-bold text-sm tracking-tight data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-primary transition-all italic">Ringkasan</TabsTrigger>
          <TabsTrigger value="transactions" className="rounded-xl px-8 py-3 font-bold text-sm tracking-tight data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-primary transition-all italic">Riwayat Transaksi</TabsTrigger>
          <TabsTrigger value="mustahik" className="rounded-xl px-8 py-3 font-bold text-sm tracking-tight data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-primary transition-all italic">Database Mustahik</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-10 focus-visible:outline-none">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StatCard 
              title="Zakat Terkumpul" 
              value={`Rp ${totals.totalIn.toLocaleString('id-ID')}`} 
              icon={<Wallet className="h-6 w-6" />} 
              sub="Total saldo masuk"
              color="emerald"
              delay={0.1}
            />
            <StatCard 
              title="Dana Tersalurkan" 
              value={`Rp ${totals.totalOut.toLocaleString('id-ID')}`} 
              icon={<HandCoins className="h-6 w-6" />} 
              sub={`${((totals.totalOut/totals.totalIn)*100 || 0).toFixed(1)}% dari total`}
              color="amber"
              delay={0.2}
            />
            <StatCard 
              title="Mustahik Terbantu" 
              value={mustahik.filter(m => m.status === 'completed').length.toString()} 
              icon={<Users className="h-6 w-6" />} 
              sub="Jiwa yang terbantu"
              color="blue"
              delay={0.3}
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-10">
            <Card className="illustrative-card p-10 border-none shadow-none hover:shadow-none">
               <CardHeader className="p-0 mb-8 flex flex-row items-center justify-between">
                 <div>
                    <CardTitle className="text-3xl font-display font-bold italic tracking-tight">Sebaran Asnaf</CardTitle>
                    <CardDescription className="font-medium text-base">Distribusi penerima berdasarkan kategori syar'i</CardDescription>
                 </div>
                 <div className="p-4 bg-stone-50 rounded-2xl">
                    <PieChart className="h-6 w-6 text-emerald-600" />
                 </div>
               </CardHeader>
               <div className="space-y-6">
                  {['fakir', 'miskin', 'amil', 'mualaf', 'gharim'].map((cat) => {
                    const count = mustahik.filter(m => m.category === cat).length;
                    const percent = (count / (mustahik.length || 1)) * 100;
                    return (
                      <div key={cat} className="space-y-3">
                         <div className="flex justify-between text-sm font-black capitalize tracking-tight">
                            <span>{cat}</span>
                            <span className="text-emerald-600">{count} Orang</span>
                         </div>
                         <div className="h-3 w-full bg-stone-100 rounded-full overflow-hidden border border-stone-200/50 p-0.5">
                            <motion.div 
                               initial={{ width: 0 }}
                               whileInView={{ width: `${percent}%` }}
                               viewport={{ once: true }}
                               transition={{ duration: 1, ease: "easeOut" }}
                               className="h-full bg-emerald-500 rounded-full" 
                            />
                         </div>
                      </div>
                    );
                  })}
               </div>
            </Card>

            <Card className="illustrative-card bg-slate-900 text-white p-10 flex flex-col justify-between relative overflow-hidden group border-none">
               <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
               <div className="space-y-6 relative z-10">
                  <Badge className="bg-emerald-500 text-black font-black uppercase tracking-widest px-4 py-1.5 rounded-full">Smart Insight</Badge>
                  <h3 className="text-4xl font-display font-bold leading-[1.2] italic tracking-tight">Dana Zakat Maal Anda mencukupi untuk membantu <span className="text-emerald-400">5 orang Gharim.</span></h3>
                  <p className="text-slate-400 font-medium text-lg leading-relaxed">Berdasarkan database mustahik, ada beberapa warga yang membutuhkan bantuan pelunasan utang darurat bulan ini.</p>
               </div>
               <Button className="w-full rounded-2xl h-16 bg-white text-slate-900 hover:bg-stone-100 font-black text-lg mt-10 shadow-2xl shadow-black/20 relative z-10">
                 Lihat Rekomendasi Penyaluran
               </Button>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="focus-visible:outline-none">
           <Card className="illustrative-card overflow-hidden border-none shadow-none hover:shadow-none">
              <div className="p-8 border-b border-stone-100 flex flex-col md:flex-row justify-between items-center gap-4">
                 <h2 className="text-2xl font-display font-bold italic tracking-tight">Log Aktivitas ZIS</h2>
                 <div className="flex gap-3">
                    <Button variant="outline" size="sm" className="rounded-full h-11 px-6 font-bold border-2 gap-2"><Filter className="h-4 w-4" /> Filter</Button>
                    <Button variant="outline" size="sm" className="rounded-full h-11 px-6 font-bold border-2 gap-2"><FileText className="h-4 w-4" /> Export PDF</Button>
                 </div>
              </div>
              <Table>
                 <TableHeader className="bg-stone-50/50">
                    <TableRow className="border-b border-stone-100">
                       <TableHead className="px-10 py-6 font-black uppercase text-[10px] tracking-[0.2em] text-muted-foreground">Tanggal</TableHead>
                       <TableHead className="py-6 font-black uppercase text-[10px] tracking-[0.2em] text-muted-foreground">Muzakki / Mustahik</TableHead>
                       <TableHead className="py-6 font-black uppercase text-[10px] tracking-[0.2em] text-muted-foreground">Tipe & Arah</TableHead>
                       <TableHead className="py-6 font-black uppercase text-[10px] tracking-[0.2em] text-muted-foreground">Status</TableHead>
                       <TableHead className="py-6 font-black uppercase text-[10px] tracking-[0.2em] text-muted-foreground text-right px-10">Jumlah</TableHead>
                    </TableRow>
                 </TableHeader>
                 <TableBody>
                    {transactions.map((tx, idx) => (
                      <motion.tr 
                        key={tx.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="group hover:bg-stone-50 transition-colors border-b border-stone-50 last:border-none"
                      >
                         <TableCell className="px-10 font-bold text-muted-foreground/70">{format(tx.date, 'dd MMM yyyy')}</TableCell>
                         <TableCell className="font-black text-slate-800">{tx.muzakki_name || tx.mustahik_id || 'Ummat'}</TableCell>
                         <TableCell>
                            <div className="flex items-center gap-3">
                               <Badge variant="outline" className="capitalize border-stone-200 bg-white font-bold text-[10px] px-3">
                                 {tx.type.replace('_', ' ')}
                               </Badge>
                               {tx.flow === 'in' ? <ArrowUpRight className="h-4 w-4 text-emerald-500" /> : <ArrowDownRight className="h-4 w-4 text-red-500" />}
                            </div>
                         </TableCell>
                         <TableCell>
                            <Badge className={`rounded-full px-4 py-1 font-black text-[10px] ${
                                tx.payment_status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                               {tx.payment_status === 'completed' ? 'SELESAI' : 'PROSES'}
                            </Badge>
                         </TableCell>
                         <TableCell className={`text-right px-10 font-black text-lg tracking-tighter ${tx.flow === 'in' ? 'text-emerald-600' : 'text-red-600'}`}>
                            {tx.flow === 'in' ? '+' : '-'}Rp {tx.amount.toLocaleString('id-ID')}
                         </TableCell>
                      </motion.tr>
                    ))}
                 </TableBody>
              </Table>
           </Card>
        </TabsContent>

        <TabsContent value="mustahik" className="focus-visible:outline-none space-y-10">
           <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="relative w-full md:w-96">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-300" />
                 <Input className="pl-12 rounded-full border-2 h-14 bg-white shadow-sm focus:ring-emerald-500 text-base" placeholder="Cari nama atau nomor HP..." />
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full md:w-auto rounded-full h-14 px-10 font-black text-base shadow-xl shadow-emerald-200/50 bg-primary hover:bg-primary/90 gap-3">
                    <Users className="h-5 w-5" /> Tambah Mustahik
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-[2.5rem] illustrative-card p-10">
                   <DialogHeader><DialogTitle className="text-3xl font-display font-bold italic">Data Mustahik Baru</DialogTitle></DialogHeader>
                   <MustahikForm />
                </DialogContent>
              </Dialog>
           </div>

           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {mustahik.map((m, idx) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="illustrative-card p-8 flex flex-col group cursor-default border-none shadow-none hover:shadow-none hover:translate-y-0">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-4 bg-stone-50 rounded-2xl group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-all duration-300">
                          <User className="h-7 w-7" />
                        </div>
                        <Badge className="bg-slate-900 text-white capitalize font-black tracking-widest text-[10px] px-4 py-1.5 rounded-full">{m.category}</Badge>
                    </div>
                    <h3 className="text-2xl font-display font-bold mb-1 italic tracking-tight">{m.name}</h3>
                    <p className="text-muted-foreground font-bold text-sm mb-6 flex items-center gap-2">
                      <CreditCard className="h-4 w-4 opacity-30" />
                      {m.phone || 'No. HP tidak ada'}
                    </p>
                    <div className="pt-6 border-t border-stone-100 flex justify-between items-center mt-auto">
                        <div className="flex items-center gap-3 text-xs font-black text-muted-foreground uppercase tracking-widest">
                          <CheckCircle2 className={`h-5 w-5 ${m.status === 'completed' ? 'text-emerald-500' : 'text-stone-300'}`} />
                          {m.status === 'completed' ? 'Terbantu' : 'Menunggu'}
                        </div>
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-stone-100 h-10 w-10"><MoreVertical className="h-5 w-5" /></Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
           </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ title, value, icon, sub, color, delay }: any) {
  const colors: any = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    blue: "bg-blue-50 text-blue-700 border-blue-100"
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      className="illustrative-card p-8 flex flex-col justify-between group cursor-default"
    >
       <div className="flex justify-between items-start mb-8">
          <div className={`p-4 rounded-2xl bg-white shadow-sm group-hover:scale-110 transition-transform duration-300 ${colors[color].split(' ')[1]}`}>
             {icon}
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{title}</p>
       </div>
       <div className="space-y-1">
          <p className="text-4xl font-display font-black tracking-tighter italic text-slate-900 leading-none">{value}</p>
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/60 mt-2">{sub}</p>
       </div>
    </motion.div>
  );
}

function ZisEntryForm({ type }: { type: 'in' | 'out' }) {
  return (
    <form className="space-y-6 pt-6">
      <div className="space-y-2">
        <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Tipe ZIS</Label>
        <Select name="type" defaultValue="zakat_fitrah">
          <SelectTrigger className="h-14 rounded-xl border-2 focus:ring-emerald-500 font-bold">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-2">
            <SelectItem value="zakat_fitrah">Zakat Fitrah</SelectItem>
            <SelectItem value="zakat_maal">Zakat Maal</SelectItem>
            <SelectItem value="fidyah">Fidyah</SelectItem>
            <SelectItem value="infaq_shadaqah">Infaq & Shadaqah</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">{type === 'in' ? 'Nama Muzakki' : 'Pilih Mustahik'}</Label>
        <Input name="name" required placeholder={type === 'in' ? "Hamba Allah" : "Pilih dari database"} className="h-14 rounded-xl border-2 focus:ring-emerald-500 font-bold" />
      </div>
      <div className="space-y-2">
        <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Jumlah (Rp)</Label>
        <div className="relative">
           <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-stone-300">Rp</span>
           <Input name="amount" type="number" required placeholder="0" className="h-14 rounded-xl border-2 pl-12 focus:ring-emerald-500 font-black text-xl tracking-tighter" />
        </div>
      </div>
      <div className="space-y-2">
        <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Keterangan</Label>
        <Input name="description" placeholder="Contoh: Zakat Maal periode 2024" className="h-14 rounded-xl border-2 focus:ring-emerald-500" />
      </div>
      <Button type="submit" className="w-full h-16 text-lg rounded-full font-black bg-emerald-600 hover:bg-emerald-700 mt-4 shadow-xl shadow-emerald-200">
        Simpan Data Transaksi
      </Button>
    </form>
  );
}

function MustahikForm() {
  return (
    <form className="space-y-6 pt-6">
      <div className="space-y-2">
        <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Nama Lengkap</Label>
        <Input name="name" required placeholder="Nama Lengkap Mustahik" className="h-14 rounded-xl border-2 focus:ring-primary font-bold" />
      </div>
      <div className="space-y-2">
        <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Kategori Asnaf</Label>
        <Select name="category" defaultValue="miskin">
          <SelectTrigger className="h-14 rounded-xl border-2 focus:ring-primary font-bold">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-2">
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
        <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Nomor WhatsApp</Label>
        <Input name="phone" placeholder="0812..." className="h-14 rounded-xl border-2 focus:ring-primary" />
      </div>
      <div className="space-y-2">
        <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Alamat Lengkap</Label>
        <Input name="address" placeholder="Contoh: Jl. Ahmad Yani No. 123" className="h-14 rounded-xl border-2 focus:ring-primary" />
      </div>
      <Button type="submit" className="w-full h-16 text-lg rounded-full font-black bg-primary hover:bg-primary/90 mt-4 shadow-xl shadow-primary/20">
        Daftarkan Mustahik Baru
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

