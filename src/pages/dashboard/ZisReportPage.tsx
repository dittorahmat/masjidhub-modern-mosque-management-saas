import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Calendar,
  Download,
  TrendingUp,
  FileText,
  Filter,
  BarChart3,
  PieChart
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import type { ZisTransaction } from '@shared/types';

interface ZisReport {
  totals: Record<string, number>;
  byType: Record<string, ZisTransaction[]>;
  byMonth: Record<string, ZisTransaction[]>;
  totalAmount: number;
  totalTransactions: number;
}

export default function ZisReportPage() {
  const { slug } = useParams();
  const [dateRange, setDateRange] = useState({
    from: format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd'), // Start of current year
    to: format(new Date(), 'yyyy-MM-dd') // Today
  });

  const { data: report, isLoading, refetch } = useQuery({
    queryKey: ['zis-report', slug, dateRange.from, dateRange.to],
    queryFn: () => api<ZisReport>(`/api/${slug}/zis/report?from=${dateRange.from}&to=${dateRange.to}`)
  });

  const handleDateChange = (field: 'from' | 'to', value: string) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  const handleRefresh = () => {
    refetch();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const typeLabels: Record<string, string> = {
    'zakat_fitrah': 'Zakat Fitrah',
    'zakat_maal': 'Zakat Maal',
    'fidyah': 'Fidyah',
    'infaq_shadaqah': 'Infaq & Shadaqah'
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12 space-y-8 animate-fade-in-up">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Laporan ZIS</h1>
            <p className="text-muted-foreground">Laporan pengelolaan Zakat, Infaq, dan Shadaqah.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Ekspor Laporan
            </Button>
          </div>
        </div>

        <Card className="illustrative-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Laporan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="from-date">Dari Tanggal</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="from-date"
                    type="date"
                    value={dateRange.from}
                    onChange={(e) => handleDateChange('from', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="to-date">Sampai Tanggal</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="to-date"
                    type="date"
                    value={dateRange.to}
                    onChange={(e) => handleDateChange('to', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleRefresh} className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Terapkan Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : report ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="illustrative-card">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Transaksi</p>
                    <p className="text-2xl font-bold">{report.totalTransactions}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="illustrative-card">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Nominal</p>
                    <p className="text-2xl font-bold">{formatCurrency(report.totalAmount)}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="illustrative-card">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Zakat Fitrah</p>
                    <p className="text-2xl font-bold">{formatCurrency(report.totals.zakat_fitrah || 0)}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="illustrative-card">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                    <PieChart className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Infaq & Shadaqah</p>
                    <p className="text-2xl font-bold">{formatCurrency(report.totals['infaq_shadaqah'] || 0)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="illustrative-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Distribusi Berdasarkan Jenis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(report.totals).map(([type, amount]) => (
                      <div key={type} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="font-medium">{typeLabels[type] || type}</span>
                          <span className="font-bold">{formatCurrency(amount)}</span>
                        </div>
                        <div className="w-full bg-stone-200 rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${(amount / report.totalAmount) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="illustrative-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Distribusi Bulanan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(report.byMonth).map(([month, transactions]) => {
                      const total = transactions.reduce((sum, tx) => sum + tx.amount, 0);
                      return (
                        <div key={month} className="space-y-2">
                          <div className="flex justify-between">
                            <span className="font-medium">
                              {format(new Date(month + '-01'), 'MMMM yyyy', { locale: id })}
                            </span>
                            <span className="font-bold">{formatCurrency(total)}</span>
                          </div>
                          <div className="w-full bg-stone-200 rounded-full h-2">
                            <div 
                              className="bg-emerald-500 h-2 rounded-full" 
                              style={{ width: `${(total / report.totalAmount) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="illustrative-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Rincian Transaksi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(report.byType).map(([type, transactions]) => (
                    <div key={type} className="border rounded-lg p-4">
                      <h3 className="font-bold text-lg mb-3">{typeLabels[type] || type}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {transactions.map(tx => (
                          <div key={tx.id} className="border rounded-lg p-3 bg-stone-50">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{tx.muzakki_name || 'Anonim'}</p>
                                <p className="text-sm text-muted-foreground">{tx.description}</p>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {formatCurrency(tx.amount)}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              {format(tx.date, 'dd MMM yyyy', { locale: id })}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
            <h3 className="mt-4 text-lg font-medium">Tidak ada data laporan</h3>
            <p className="text-muted-foreground mt-2">
              Silakan atur rentang tanggal dan terapkan filter untuk melihat laporan
            </p>
          </div>
        )}
      </div>
    </div>
  );
}