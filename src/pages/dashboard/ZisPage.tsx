import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, History, HeartPulse, User, Wallet, FileText, CreditCard, HandCoins } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ZisTransaction } from '@shared/types';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale/id';
export default function ZisPage() {
  const { slug } = useParams();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<ZisTransaction | null>(null);

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['zis', slug],
    queryFn: () => api<ZisTransaction[]>(`/api/${slug}/zis`)
  });

  const createMutation = useMutation({
    mutationFn: (newTx: Partial<ZisTransaction>) => api(`/api/${slug}/zis`, {
      method: 'POST',
      body: JSON.stringify(newTx)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zis', slug] });
      toast.success('Penerimaan ZIS berhasil dicatat');
      setIsDialogOpen(false);
    }
  });

  const processPaymentMutation = useMutation({
    mutationFn: ({ id, paymentData }: { id: string; paymentData: any }) =>
      api(`/api/${slug}/zis/${id}/process-payment`, {
        method: 'POST',
        body: JSON.stringify(paymentData)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zis', slug] });
      toast.success('Pembayaran ZIS berhasil diproses');
      setPaymentDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal memproses pembayaran');
    }
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      type: formData.get('type') as any,
      amount: Number(formData.get('amount')),
      muzakki_name: formData.get('muzakki_name') as string,
      muzakki_email: formData.get('muzakki_email') as string,
      muzakki_phone: formData.get('muzakki_phone') as string,
      description: formData.get('description') as string,
      flow: 'in',
      payment_status: 'pending' // New transactions start as pending
    });
  };

  const handleProcessPayment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedTransaction) return;

    const formData = new FormData(e.currentTarget);
    processPaymentMutation.mutate({
      id: selectedTransaction.id,
      paymentData: {
        payment_method: formData.get('payment_method') as string,
        amount: selectedTransaction.amount
      }
    });
  };

  const totals = transactions.reduce((acc, tx) => {
    if (tx.flow === 'in') acc[tx.type] = (acc[tx.type] || 0) + tx.amount;
    return acc;
  }, {} as Record<string, number>);

  const openPaymentDialog = (tx: ZisTransaction) => {
    setSelectedTransaction(tx);
    setPaymentDialogOpen(true);
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Modul ZIS</h1>
          <p className="text-muted-foreground">Pengelolaan Zakat, Infaq, dan Shadaqah yang amanah.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={`/app/${slug}/zis/payment`}>
            <Button variant="default" className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              <HandCoins className="h-4 w-4" />
              Bayar ZIS
            </Button>
          </Link>
          <Link to={`/app/${slug}/zis/report`}>
            <Button variant="outline" className="gap-2">
              <FileText className="h-4 w-4" />
              Laporan ZIS
            </Button>
          </Link>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 rounded-xl h-12 shadow-lg shadow-emerald-200">
                <PlusCircle className="h-4 w-4" /> Penerimaan ZIS
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Catat Penerimaan ZIS</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Tipe ZIS</Label>
                  <Select name="type" defaultValue="zakat_fitrah">
                    <SelectTrigger>
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
                  <Label>Nama Muzakki (Pemberi)</Label>
                  <Input name="muzakki_name" required placeholder="Nama Lengkap" />
                </div>
                <div className="space-y-2">
                  <Label>Email Muzakki</Label>
                  <Input name="muzakki_email" type="email" placeholder="email@contoh.com" />
                </div>
                <div className="space-y-2">
                  <Label>No. HP Muzakki</Label>
                  <Input name="muzakki_phone" placeholder="081234567890" />
                </div>
                <div className="space-y-2">
                  <Label>Jumlah (Rp)</Label>
                  <Input name="amount" type="number" required placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Keterangan</Label>
                  <Input name="description" placeholder="Catatan tambahan" />
                </div>
                <Button type="submit" className="w-full h-12 text-lg" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Menyimpan...' : 'Simpan Transaksi'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ZisStatCard
          title="Zakat Fitrah"
          value={totals.zakat_fitrah || 0}
          icon={<HeartPulse className="text-emerald-600" />}
          color="bg-emerald-50 border-emerald-100"
        />
        <ZisStatCard
          title="Zakat Maal"
          value={totals.zakat_maal || 0}
          icon={<Wallet className="text-amber-600" />}
          color="bg-amber-50 border-amber-100"
        />
        <ZisStatCard
          title="Infaq & Shadaqah"
          value={totals.infaq_shadaqah || 0}
          icon={<User className="text-blue-600" />}
          color="bg-blue-50 border-blue-100"
        />
      </div>
      <Card className="illustrative-card overflow-hidden">
        <CardHeader className="bg-stone-50/50 border-b">
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Riwayat Penerimaan Terkini
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Muzakki</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Status Pembayaran</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
                <TableHead className="text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell>
                  </TableRow>
                ))
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20 opacity-50 italic">
                    Belum ada data transaksi ZIS.
                  </TableCell>
                </TableRow>
              ) : (
                transactions.sort((a,b) => b.date - a.date).map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{format(tx.date, 'dd MMM yyyy', { locale: localeId })}</TableCell>
                    <TableCell className="font-bold">{tx.muzakki_name || 'Hamba Allah'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {tx.type.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={tx.payment_status === 'completed' ? 'default' :
                                tx.payment_status === 'pending' ? 'secondary' :
                                tx.payment_status === 'failed' ? 'destructive' : 'outline'}
                      >
                        {tx.payment_status === 'completed' ? 'Lunas' :
                         tx.payment_status === 'pending' ? 'Pending' :
                         tx.payment_status === 'failed' ? 'Gagal' :
                         tx.payment_status === 'refunded' ? 'Dikembalikan' : tx.payment_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-emerald-600">
                      Rp {tx.amount.toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell className="text-center">
                      {tx.payment_status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openPaymentDialog(tx)}
                          className="gap-1"
                        >
                          <CreditCard className="h-3 w-3" />
                          Proses
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Payment Processing Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Proses Pembayaran ZIS</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4 pt-4">
              <div className="p-4 bg-stone-50 rounded-lg">
                <h3 className="font-bold">{selectedTransaction.muzakki_name || 'Anonim'}</h3>
                <p className="text-sm text-muted-foreground">{selectedTransaction.description}</p>
                <p className="font-bold text-lg mt-2">Rp {selectedTransaction.amount.toLocaleString('id-ID')}</p>
              </div>

              <form onSubmit={handleProcessPayment} className="space-y-4">
                <div className="space-y-2">
                  <Label>Metode Pembayaran</Label>
                  <Select name="payment_method" defaultValue="bank_transfer">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Tunai</SelectItem>
                      <SelectItem value="bank_transfer">Transfer Bank</SelectItem>
                      <SelectItem value="mobile_payment">Pembayaran Mobile</SelectItem>
                      <SelectItem value="credit_card">Kartu Kredit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setPaymentDialogOpen(false)}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={processPaymentMutation.isPending}
                  >
                    {processPaymentMutation.isPending ? 'Memproses...' : 'Proses Pembayaran'}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
function ZisStatCard({ title, value, icon, color }: any) {
  return (
    <Card className={`illustrative-card ${color}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-bold uppercase tracking-widest opacity-70 flex justify-between items-center">
          {title}
          {icon}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-display font-bold">Rp {value.toLocaleString('id-ID')}</div>
      </CardContent>
    </Card>
  );
}