import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { 
  CreditCard, 
  Wallet, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  CheckCircle, 
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import type { ZisTransaction, Mustahik } from '@shared/types';

export default function ZisPaymentPage() {
  const { slug } = useParams();
  const queryClient = useQueryClient();
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer' | 'mobile_payment' | 'credit_card'>('bank_transfer');
  const [paymentForm, setPaymentForm] = useState({
    type: 'infaq_shadaqah',
    amount: '',
    muzakki_name: '',
    muzakki_email: '',
    muzakki_phone: '',
    description: '',
    mustahik_id: ''
  });
  
  const { data: mustahikList = [] } = useQuery({
    queryKey: ['mustahik', slug],
    queryFn: () => api<Mustahik[]>(`/api/${slug}/mustahik`)
  });

  const createTransactionMutation = useMutation({
    mutationFn: (newTx: Partial<ZisTransaction>) => api<ZisTransaction>(`/api/${slug}/zis`, {
      method: 'POST',
      body: JSON.stringify(newTx)
    }),
    onSuccess: (tx) => {
      // If payment method is not cash, process payment immediately
      if (paymentMethod !== 'cash') {
        processPayment(tx.id);
      } else {
        toast.success('Transaksi ZIS berhasil dicatat');
        queryClient.invalidateQueries({ queryKey: ['zis', slug] });
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal membuat transaksi ZIS');
    }
  });

  const processPaymentMutation = useMutation({
    mutationFn: (id: string) => api(`/api/${slug}/zis/${id}/process-payment`, {
      method: 'POST',
      body: JSON.stringify({ payment_method: paymentMethod })
    }),
    onSuccess: () => {
      toast.success('Pembayaran ZIS berhasil diproses');
      queryClient.invalidateQueries({ queryKey: ['zis', slug] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal memproses pembayaran');
    }
  });

  const processPayment = (txId: string) => {
    processPaymentMutation.mutate(txId);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPaymentForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setPaymentForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(paymentForm.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Jumlah pembayaran tidak valid');
      return;
    }
    
    createTransactionMutation.mutate({
      ...paymentForm,
      type: paymentForm.type as ZisTransaction['type'],
      mustahik_id: paymentForm.mustahik_id === 'all' ? '' : paymentForm.mustahik_id,
      amount: amount,
      flow: 'in',
      payment_method: paymentMethod,
      payment_status: (paymentMethod === 'cash' ? 'completed' : 'pending') as ZisTransaction['payment_status']
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Link to={`/app/${slug}/zis`} className="flex items-center gap-2 text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Modul ZIS
        </Link>
      </div>
      
      <div className="space-y-8 animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-display font-bold">Pembayaran ZIS</h1>
          <p className="text-muted-foreground">Lakukan pembayaran Zakat, Infaq, dan Shadaqah secara aman dan terpercaya.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="illustrative-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Detail Pembayaran
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="type">Jenis ZIS</Label>
                      <Select 
                        name="type" 
                        value={paymentForm.type} 
                        onValueChange={(value) => handleSelectChange('type', value)}
                      >
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
                      <Label htmlFor="amount">Jumlah Pembayaran (Rp)</Label>
                      <Input
                        id="amount"
                        name="amount"
                        type="number"
                        value={paymentForm.amount}
                        onChange={handleInputChange}
                        placeholder="0"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Deskripsi</Label>
                      <Input
                        id="description"
                        name="description"
                        value={paymentForm.description}
                        onChange={handleInputChange}
                        placeholder="Contoh: Infaq bulanan, Zakat penghasilan, dll"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-bold text-lg">Data Muzakki</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="muzakki_name">Nama Lengkap</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="muzakki_name"
                          name="muzakki_name"
                          value={paymentForm.muzakki_name}
                          onChange={handleInputChange}
                          placeholder="Nama lengkap Anda"
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="muzakki_email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="muzakki_email"
                            name="muzakki_email"
                            type="email"
                            value={paymentForm.muzakki_email}
                            onChange={handleInputChange}
                            placeholder="email@contoh.com"
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="muzakki_phone">No. HP</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="muzakki_phone"
                            name="muzakki_phone"
                            value={paymentForm.muzakki_phone}
                            onChange={handleInputChange}
                            placeholder="081234567890"
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-bold text-lg">Penerima (Mustahik)</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="mustahik_id">Pilih Mustahik</Label>
                      <Select 
                        name="mustahik_id" 
                        value={paymentForm.mustahik_id || 'all'} 
                        onValueChange={(value) => handleSelectChange('mustahik_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih penerima ZIS" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Mustahik</SelectItem>
                          {mustahikList.map(mustahik => (
                            <SelectItem key={mustahik.id} value={mustahik.id}>
                              {mustahik.name} - {mustahik.category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">
                        Pilih penerima ZIS atau biarkan kosong untuk didistribusikan secara umum
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-bold text-lg">Metode Pembayaran</h3>
                    
                    <RadioGroup 
                      value={paymentMethod} 
                      onValueChange={(value: any) => setPaymentMethod(value)}
                      className="grid grid-cols-2 gap-4"
                    >
                      <div>
                        <RadioGroupItem 
                          value="bank_transfer" 
                          id="bank_transfer" 
                          className="peer sr-only" 
                        />
                        <Label 
                          htmlFor="bank_transfer" 
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Wallet className="h-5 w-5" />
                            <span>Transfer Bank</span>
                          </div>
                          <p className="text-xs text-muted-foreground">BCA, BNI, Mandiri, dll</p>
                        </Label>
                      </div>
                      
                      <div>
                        <RadioGroupItem 
                          value="mobile_payment" 
                          id="mobile_payment" 
                          className="peer sr-only" 
                        />
                        <Label 
                          htmlFor="mobile_payment" 
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Phone className="h-5 w-5" />
                            <span>Pembayaran Mobile</span>
                          </div>
                          <p className="text-xs text-muted-foreground">OVO, DANA, GoPay, dll</p>
                        </Label>
                      </div>
                      
                      <div>
                        <RadioGroupItem 
                          value="credit_card" 
                          id="credit_card" 
                          className="peer sr-only" 
                        />
                        <Label 
                          htmlFor="credit_card" 
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <CreditCard className="h-5 w-5" />
                            <span>Kartu Kredit</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Visa, Mastercard, JCB</p>
                        </Label>
                      </div>
                      
                      <div>
                        <RadioGroupItem 
                          value="cash" 
                          id="cash" 
                          className="peer sr-only" 
                        />
                        <Label 
                          htmlFor="cash" 
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <User className="h-5 w-5" />
                            <span>Tunai Langsung</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Bayar langsung ke amil</p>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 text-lg gap-2"
                    disabled={createTransactionMutation.isPending || processPaymentMutation.isPending}
                  >
                    {createTransactionMutation.isPending || processPaymentMutation.isPending ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Memproses Pembayaran...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4" />
                        Bayar Sekarang
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="illustrative-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  Ringkasan Pembayaran
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Jenis ZIS</span>
                    <span className="font-medium capitalize">
                      {paymentForm.type.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Jumlah</span>
                    <span className="font-bold text-lg text-emerald-600">
                      {paymentForm.amount ? `Rp ${Number(paymentForm.amount).toLocaleString('id-ID')}` : 'Rp 0'}
                    </span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Metode Pembayaran</span>
                    <span className="font-medium capitalize">
                      {paymentMethod === 'bank_transfer' && 'Transfer Bank'}
                      {paymentMethod === 'mobile_payment' && 'Pembayaran Mobile'}
                      {paymentMethod === 'credit_card' && 'Kartu Kredit'}
                      {paymentMethod === 'cash' && 'Tunai Langsung'}
                    </span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant="outline">
                      {paymentMethod === 'cash' ? 'Lunas' : 'Menunggu Pembayaran'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="illustrative-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  Informasi Penting
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• Pembayaran ZIS akan diproses secara aman melalui sistem terpercaya</p>
                <p>• Anda akan menerima bukti pembayaran setelah transaksi selesai</p>
                <p>• Dana ZIS akan didistribusikan kepada mustahik yang berhak</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}