import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { api } from '@/lib/api-client';
import { Card, CardTitle, CardDescription, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  PlusCircle, HandCoins, Users, Wallet,
  ArrowDownRight, Search, Filter, 
  ChevronRight, Plus
} from 'lucide-react';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from '@/components/ui/responsive-dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ZisTransaction, Mustahik } from '@shared/types';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { MobileFAB } from '@/components/layout/mobile/MobileFAB';
import { ZisTransactionCard } from '@/components/zis/ZisTransactionCard';
import { MustahikCard } from '@/components/zis/MustahikCard';
import { ZisEntryForm, MustahikForm } from '@/components/zis/ZisForms';

export default function ZisPage() {
  const { slug } = useParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [isInDialogOpen, setIsInDialogOpen] = useState(false);
  const [isOutDialogOpen, setIsOutDialogOpen] = useState(false);
  const [isMustahikDialogOpen, setIsMustahikDialogOpen] = useState(false);

  const { data: transactions = [] } = useQuery({
    queryKey: ['zis', slug],
    queryFn: () => api<ZisTransaction[]>(`/api/${slug}/zis`)
  });

  const { data: mustahik = [] } = useQuery({
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
    <div className="space-y-8 md:space-y-12 pb-16 md:pb-10">
      {/* Refined Header (Standardized with Overview) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8 border-b border-stone-200/60 pb-8 md:pb-10"
      >
        <div className="space-y-3 md:space-y-4">
          <nav className="flex items-center gap-2 text-muted-foreground/60 font-bold text-[10px] uppercase tracking-[0.3em]">
            <HandCoins className="h-3 w-3 text-emerald-500/40" />
            <span>Manajemen Keuangan</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-emerald-600/60">Modul ZIS</span>
          </nav>
          
          <div className="space-y-2">
            <h1 className="text-4xl md:text-6xl font-display font-black tracking-tighter italic leading-none">
              Amanah <span className="text-emerald-600">Zakat & Infaq</span>
            </h1>
            <p className="text-muted-foreground text-base md:text-xl font-medium max-w-2xl">
              Pengelolaan dana ummat yang <span className="text-foreground font-bold underline decoration-emerald-200 underline-offset-4">transparan</span> dan tepat sasaran.
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 md:gap-4">
          <ResponsiveDialog open={isInDialogOpen} onOpenChange={setIsInDialogOpen}>
            <ResponsiveDialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full h-12 md:h-14 px-6 md:px-8 font-bold gap-2 md:gap-3 shadow-xl shadow-emerald-200/50 text-sm md:text-base">
                <PlusCircle className="h-4 w-4 md:h-5 md:w-5" /> Catat Penerimaan
              </Button>
            </ResponsiveDialogTrigger>
            <ResponsiveDialogContent className="rounded-t-[2rem] md:rounded-[2.5rem] illustrative-card p-6 md:p-10 max-h-[85vh] overflow-y-auto">
              <ResponsiveDialogHeader>
                <ResponsiveDialogTitle className="text-2xl md:text-3xl font-display font-bold">Penerimaan ZIS Baru</ResponsiveDialogTitle>
              </ResponsiveDialogHeader>
              <ZisEntryForm type="in" />
            </ResponsiveDialogContent>
          </ResponsiveDialog>

          <ResponsiveDialog open={isOutDialogOpen} onOpenChange={setIsOutDialogOpen}>
            <ResponsiveDialogTrigger asChild>
              <Button variant="outline" className="rounded-full h-12 md:h-14 px-6 md:px-8 font-bold border-2 gap-2 md:gap-3 text-sm md:text-base shadow-sm hover:shadow-md transition-all">
                <ArrowDownRight className="h-4 w-4 md:h-5 md:w-5 text-red-500" /> Penyaluran Dana
              </Button>
            </ResponsiveDialogTrigger>
            <ResponsiveDialogContent className="rounded-t-[2rem] md:rounded-[2.5rem] illustrative-card p-6 md:p-10 max-h-[85vh] overflow-y-auto">
              <ResponsiveDialogHeader>
                <ResponsiveDialogTitle className="text-2xl md:text-3xl font-display font-bold">Salurkan Dana ZIS</ResponsiveDialogTitle>
              </ResponsiveDialogHeader>
              <ZisEntryForm type="out" />
            </ResponsiveDialogContent>
          </ResponsiveDialog>
        </div>
      </motion.div>

      {/* Tabs System */}
      <Tabs defaultValue="overview" className="space-y-6 md:space-y-10" onValueChange={setActiveTab}>
        <TabsList className="bg-stone-100/80 backdrop-blur-sm p-1 md:p-1.5 rounded-2xl h-auto border-2 border-stone-200/40 w-full md:w-auto overflow-x-auto flex justify-start md:justify-center">
          <TabsTrigger value="overview" className="rounded-xl px-4 md:px-8 py-2.5 md:py-3 font-bold text-xs md:text-sm tracking-tight data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-primary transition-all italic">Ringkasan</TabsTrigger>
          <TabsTrigger value="transactions" className="rounded-xl px-4 md:px-8 py-2.5 md:py-3 font-bold text-xs md:text-sm tracking-tight data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-primary transition-all italic">Riwayat Transaksi</TabsTrigger>
          <TabsTrigger value="mustahik" className="rounded-xl px-4 md:px-8 py-2.5 md:py-3 font-bold text-xs md:text-sm tracking-tight data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-primary transition-all italic">Database Mustahik</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 md:space-y-10 focus-visible:outline-none">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
            <StatCard 
              title="Zakat Terkumpul" 
              value={`Rp ${totals.totalIn.toLocaleString('id-ID')}`} 
              icon={<Wallet className="h-5 w-5 md:h-6 md:w-6" />} 
              sub="Total saldo masuk"
              color="emerald"
              delay={0.1}
            />
            <StatCard 
              title="Dana Tersalurkan" 
              value={`Rp ${totals.totalOut.toLocaleString('id-ID')}`} 
              icon={<HandCoins className="h-5 w-5 md:h-6 md:w-6" />} 
              sub={`${((totals.totalOut/totals.totalIn)*100 || 0).toFixed(1)}% dari total`}
              color="amber"
              delay={0.2}
            />
            <StatCard 
              title="Mustahik Terbantu" 
              value={mustahik.filter(m => m.status === 'completed').length.toString()} 
              icon={<Users className="h-5 w-5 md:h-6 md:w-6" />} 
              sub="Jiwa yang terbantu"
              color="blue"
              delay={0.3}
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-6 md:gap-10">
            <Card className="illustrative-card p-6 md:p-10 border-none shadow-none hover:shadow-none">
               <CardHeader className="p-0 mb-6 md:mb-8 flex flex-row items-center justify-between">
                 <div>
                    <CardTitle className="text-2xl md:text-3xl font-display font-bold italic tracking-tight">Sebaran Asnaf</CardTitle>
                    <CardDescription className="font-medium text-sm md:text-base">Distribusi penerima berdasarkan kategori syar'i</CardDescription>
                 </div>
                 <div className="p-3 md:p-4 bg-stone-50 rounded-2xl">
                    <PieChart className="h-5 w-5 md:h-6 md:w-6 text-emerald-600" />
                 </div>
               </CardHeader>
               <div className="space-y-4 md:space-y-6">
                  {['fakir', 'miskin', 'amil', 'mualaf', 'gharim'].map((cat) => {
                    const count = mustahik.filter(m => m.category === cat).length;
                    const percent = (count / (mustahik.length || 1)) * 100;
                    return (
                      <div key={cat} className="space-y-2 md:space-y-3">
                         <div className="flex justify-between text-xs md:text-sm font-black capitalize tracking-tight">
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

            <Card className="illustrative-card bg-slate-900 text-white p-6 md:p-10 flex flex-col justify-between relative overflow-hidden group border-none">
               <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
               <div className="space-y-4 md:space-y-6 relative z-10">
                  <Badge className="bg-emerald-500 text-black font-black uppercase tracking-widest px-3 md:px-4 py-1 md:py-1.5 rounded-full text-xs">Smart Insight</Badge>
                  <h3 className="text-2xl md:text-4xl font-display font-bold leading-[1.2] italic tracking-tight">Dana Zakat Maal Anda mencukupi untuk membantu <span className="text-emerald-400">5 orang Gharim.</span></h3>
                  <p className="text-slate-400 font-medium text-sm md:text-lg leading-relaxed">Berdasarkan database mustahik, ada beberapa warga yang membutuhkan bantuan pelunasan utang darurat bulan ini.</p>
               </div>
               <Button className="w-full rounded-2xl h-14 md:h-16 bg-white text-slate-900 hover:bg-stone-100 font-black text-base md:text-lg mt-6 md:mt-10 shadow-2xl shadow-black/20 relative z-10">
                 Lihat Rekomendasi Penyaluran
               </Button>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="focus-visible:outline-none">
           <Card className="illustrative-card overflow-hidden border-none shadow-none hover:shadow-none">
              <div className="p-4 md:p-8 border-b border-stone-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                 <h2 className="text-xl md:text-2xl font-display font-bold italic tracking-tight">Log Aktivitas ZIS</h2>
                 <div className="flex gap-2 md:gap-3 w-full md:w-auto">
                    <Button variant="outline" size="sm" className="rounded-full h-10 md:h-11 px-4 md:px-6 font-bold border-2 gap-2 text-xs md:text-sm"><Filter className="h-4 w-4" /> Filter</Button>
                 </div>
              </div>

              {/* Mobile View: Stacked Responsive Cards */}
              <div className="block md:hidden p-4 space-y-3">
                {transactions.length === 0 ? (
                  <div className="text-center py-12 text-stone-400 font-medium">Belum ada transaksi ZIS</div>
                ) : (
                  transactions.map((tx) => (
                    <ZisTransactionCard key={tx.id} transaction={tx} />
                  ))
                )}
              </div>

              {/* Desktop View: Relational Data Table */}
              <div className="hidden md:block overflow-x-auto">
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
                      {transactions.map((tx) => (
                        <tr 
                          key={tx.id}
                          className="group hover:bg-stone-50 transition-colors border-b border-stone-50 last:border-none"
                        >
                           <TableCell className="px-10 font-bold text-muted-foreground/70">{format(tx.date, 'dd MMM yyyy')}</TableCell>
                           <TableCell className="font-black text-slate-800">{tx.muzakki_name || tx.mustahik_id || 'Ummat'}</TableCell>
                           <TableCell>
                              <Badge variant="outline" className="capitalize border-stone-200 bg-white font-bold text-[10px] px-3">
                                {tx.type.replace('_', ' ')}
                              </Badge>
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
                        </tr>
                      ))}
                   </TableBody>
                </Table>
              </div>
           </Card>
        </TabsContent>

        <TabsContent value="mustahik" className="focus-visible:outline-none space-y-6 md:space-y-10">
           <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6">
              <div className="relative w-full md:w-96">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-stone-300" />
                 <Input className="pl-11 md:pl-12 rounded-full border-2 h-12 md:h-14 bg-white shadow-sm focus:ring-emerald-500 text-sm md:text-base" placeholder="Cari nama atau nomor HP..." />
              </div>
              <ResponsiveDialog open={isMustahikDialogOpen} onOpenChange={setIsMustahikDialogOpen}>
                <ResponsiveDialogTrigger asChild>
                  <Button className="w-full md:w-auto rounded-full h-12 md:h-14 px-8 md:px-10 font-black text-sm md:text-base shadow-xl shadow-emerald-200/50 bg-primary hover:bg-primary/90 gap-2 md:gap-3">
                    <Users className="h-4 w-4 md:h-5 md:w-5" /> Tambah Mustahik
                  </Button>
                </ResponsiveDialogTrigger>
                <ResponsiveDialogContent className="rounded-t-[2rem] md:rounded-[2.5rem] illustrative-card p-6 md:p-10 max-h-[85vh] overflow-y-auto">
                   <ResponsiveDialogHeader><ResponsiveDialogTitle className="text-2xl md:text-3xl font-display font-bold italic">Data Mustahik Baru</ResponsiveDialogTitle></ResponsiveDialogHeader>
                   <MustahikForm />
                </ResponsiveDialogContent>
              </ResponsiveDialog>
           </div>

           {/* Mustahik Cards Grid (Responsive for both mobile & desktop) */}
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
              {mustahik.map((m) => (
                <MustahikCard key={m.id} mustahik={m} />
              ))}
           </div>
        </TabsContent>
      </Tabs>

      {/* Floating Action Button for Mobile */}
      <MobileFAB 
        icon={Plus} 
        label={activeTab === 'mustahik' ? "Tambah Mustahik" : "Catat Penerimaan ZIS"} 
        onClick={() => {
          if (activeTab === 'mustahik') {
            setIsMustahikDialogOpen(true);
          } else {
            setIsInDialogOpen(true);
          }
        }} 
      />
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
      className="illustrative-card p-6 md:p-8 flex flex-col justify-between group cursor-default"
    >
       <div className="flex justify-between items-start mb-6 md:mb-8">
          <div className={`p-3 md:p-4 rounded-2xl bg-white shadow-sm group-hover:scale-110 transition-transform duration-300 ${colors[color].split(' ')[1]}`}>
             {icon}
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{title}</p>
       </div>
       <div className="space-y-1">
          <p className="text-2xl md:text-4xl font-display font-black tracking-tighter italic text-slate-900 leading-none">{value}</p>
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/60 mt-2">{sub}</p>
       </div>
    </motion.div>
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
