import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Trash2, 
  BrainCircuit,
  Save,
  Loader2,
  ChevronLeft,
  Copy,
  TrendingUp,
  Heart,
  PartyPopper
} from 'lucide-react';
import type { ParsedTransaction } from '@shared/types';
import { cn } from '@/lib/utils';

export default function ImportStatementPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<{ fileHash: string, transactions: ParsedTransaction[] } | null>(null);
  const [impactData, setImpactData] = useState<any | null>(null);

  const parseMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return api<{ fileHash: string, transactions: ParsedTransaction[] }>(`/api/${slug}/finance/parse-statement`, {
        method: 'POST',
        body: formData
      });
    },
    onSuccess: (data) => {
      setParsedData(data);
      toast.success('Analisis mutasi selesai. Silakan tinjau data di bawah.');
    },
    onError: (error: any) => toast.error(error.message || 'Gagal memproses file mutasi.')
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => 
      api(`/api/${slug}/finance/bulk-save`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['finance', slug] });
      setImpactData(res);
    },
    onError: () => toast.error('Gagal menyimpan transaksi.')
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseMutation.mutate(selectedFile);
    }
  };

  const handleSave = () => {
    if (!parsedData || !file) return;
    const toSave = parsedData.transactions.filter(tx => !tx.isDuplicate);
    saveMutation.mutate({
      transactions: toSave,
      fileHash: parsedData.fileHash,
      fileName: file.name
    });
  };

  const handleFinish = () => {
    setImpactData(null);
    navigate(`/app/${slug}/finance`);
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-display font-bold text-stone-800">Impor Mutasi Bank</h1>
            <p className="text-muted-foreground text-sm">Otomasi pencatatan keuangan menggunakan AI.</p>
          </div>
        </div>
      </div>

      {!parsedData ? (
        <Card className="border-dashed border-2 border-stone-200 bg-white rounded-3xl py-20 flex flex-col items-center justify-center text-center">
          <div className="bg-emerald-50 p-6 rounded-full mb-6">
            {parseMutation.isPending ? (
              <Loader2 className="h-12 w-12 text-emerald-600 animate-spin" />
            ) : (
              <Upload className="h-12 w-12 text-emerald-600" />
            )}
          </div>
          <div className="max-w-sm space-y-2">
            <h2 className="text-xl font-bold text-stone-800">Unggah File Mutasi (PDF)</h2>
            <p className="text-sm text-stone-500">
              {parseMutation.isPending 
                ? "AI sedang membaca dan mengkategorikan transaksi Anda. Mohon tunggu sejenak..." 
                : "Tarik file mutasi bank (BCA/Mandiri/BSI) ke sini atau klik tombol di bawah."}
            </p>
          </div>
          {!parseMutation.isPending && (
            <div className="mt-8 relative">
              <input type="file" accept=".pdf" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileUpload} />
              <Button size="lg" className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 px-8 shadow-lg shadow-emerald-600/20">
                Pilih File PDF
              </Button>
            </div>
          )}
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="rounded-2xl border-stone-100 shadow-sm">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-stone-400">Total Transaksi</p>
                  <p className="text-xl font-black">{parsedData.transactions.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-stone-100 shadow-sm">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-stone-400">Siap Impor</p>
                  <p className="text-xl font-black">{parsedData.transactions.filter(t => !t.isDuplicate).length}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-stone-100 shadow-sm">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="bg-amber-50 p-3 rounded-xl text-amber-600">
                  <Copy className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-stone-400">Terdeteksi Duplikat</p>
                  <p className="text-xl font-black">{parsedData.transactions.filter(t => t.isDuplicate).length}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-3xl border-stone-200 shadow-sm overflow-hidden bg-white">
            <CardHeader className="border-b bg-stone-50/50 py-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <BrainCircuit className="h-4 w-4 text-emerald-600" /> Hasil Analisis AI
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setParsedData(null)} className="text-stone-400">Batal</Button>
                  <Button 
                    onClick={handleSave} 
                    disabled={saveMutation.isPending}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 h-9 px-6 shadow-lg shadow-emerald-600/20"
                  >
                    {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Simpan ke Pembukuan
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
                    <TableRow>
                      <TableHead className="text-[10px] uppercase font-bold w-[100px]">Tanggal</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold">Keterangan Mutasi</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold">Nominal</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold">Kategori (AI)</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold">Alasan AI</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.transactions.map((tx, idx) => (
                      <TableRow key={idx} className={cn(tx.isDuplicate ? "bg-stone-50 opacity-60" : "hover:bg-emerald-50/30 transition-colors")}>
                        <TableCell className="text-[11px] font-medium">{tx.date}</TableCell>
                        <TableCell className="text-[11px] font-medium leading-relaxed max-w-[250px]">
                          {tx.description}
                          {tx.isDuplicate && (
                            <div className="mt-1 flex items-center gap-1 text-[9px] text-amber-600 font-bold italic">
                              <AlertCircle className="h-2.5 w-2.5" /> Transaksi Serupa Ditemukan
                            </div>
                          )}
                        </TableCell>
                        <TableCell className={cn("text-xs font-black", tx.type === 'income' ? "text-emerald-600" : "text-rose-600")}>
                          {tx.type === 'income' ? '+' : '-'} {tx.amount.toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-white text-[10px] font-bold border-stone-200">
                            {tx.suggestedCategory}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-[10px] text-stone-500 italic leading-relaxed">
                          {tx.rationale}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Impact Dialog */}
      <Dialog open={!!impactData} onOpenChange={() => !saveMutation.isPending && handleFinish()}>
        <DialogContent className="sm:max-w-md rounded-3xl border-none p-0 overflow-hidden">
          <div className="bg-emerald-600 p-8 text-center text-white space-y-4">
            <div className="bg-white/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto backdrop-blur-md animate-bounce">
              <PartyPopper className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-black font-display">Impor Berhasil!</h2>
            <p className="text-emerald-100 text-sm">Alhamdulillah, {impactData?.count} transaksi telah tercatat otomatis di pembukuan masjid.</p>
          </div>
          <div className="p-8 space-y-6 bg-white">
            <div className="space-y-4">
              <h4 className="text-[10px] uppercase font-bold text-stone-400 tracking-widest">Ringkasan Dampak</h4>
              <div className="space-y-3">
                {impactData?.impact && Object.entries(impactData.impact).map(([cat, val]: any) => (
                  <div key={cat} className="flex justify-between items-center p-3 bg-stone-50 rounded-2xl border border-stone-100">
                    <span className="text-xs font-bold text-stone-700 capitalize">{cat}</span>
                    <span className="text-sm font-black text-emerald-600">+ Rp {val.toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>
            </div>

            {impactData?.donorsFound > 0 && (
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-4">
                <div className="bg-amber-100 p-2 rounded-xl text-amber-700">
                  <Heart className="h-5 w-5 fill-current" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-amber-900">Donatur Rutin Terdeteksi</h5>
                  <p className="text-[10px] text-amber-800 leading-relaxed mt-1">
                    AI menemukan {impactData.donorsFound} potensi donatur rutin. Sistem akan otomatis menandai mereka di modul Anggota untuk apresiasi lebih lanjut.
                  </p>
                </div>
              </div>
            )}

            <Button onClick={handleFinish} className="w-full h-12 rounded-2xl bg-emerald-600 shadow-xl shadow-emerald-600/20 text-white hover:bg-emerald-700">
              Selesai & Kembali
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
