import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Wallet, ArrowUpCircle, ArrowDownCircle, Search } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { Transaction } from '@shared/types';
export default function FinancePage() {
  const { slug } = useParams();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['finance', slug],
    queryFn: () => api<Transaction[]>(`/api/${slug}/finance`)
  });
  const createMutation = useMutation({
    mutationFn: (newTx: Partial<Transaction>) => api(`/api/${slug}/finance`, {
      method: 'POST',
      body: JSON.stringify(newTx)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', slug] });
      toast.success('Transaction recorded');
      setIsDialogOpen(false);
    }
  });
  const totals = transactions.reduce((acc, tx) => {
    if (tx.type === 'income') acc.income += tx.amount;
    else acc.expense += tx.amount;
    return acc;
  }, { income: 0, expense: 0 });
  const filtered = transactions.filter(t => 
    t.category.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      type: formData.get('type') as 'income' | 'expense',
      amount: Number(formData.get('amount')),
      category: formData.get('category') as string,
      description: formData.get('description') as string,
    });
  };
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12 space-y-8 animate-fade-in-up">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-display font-bold">Finance Management</h1>
            <p className="text-muted-foreground">Monitor cash flow and track community contributions.</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <PlusCircle className="h-4 w-4" /> Record Transaction
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>New Transaction</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Transaction Type</Label>
                  <Select name="type" defaultValue="income">
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Income (Infaq/Donation)</SelectItem>
                      <SelectItem value="expense">Expense (Operational)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Amount (Rp)</Label>
                  <Input name="amount" type="number" required placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input name="category" required placeholder="e.g. Friday Infaq, Electricity" />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input name="description" placeholder="Optional details" />
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Saving...' : 'Save Transaction'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="illustrative-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
              <Wallet className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rp {(totals.income - totals.expense).toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="illustrative-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Income</CardTitle>
              <ArrowUpCircle className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">Rp {totals.income.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="illustrative-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <ArrowDownCircle className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">Rp {totals.expense.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>
        <Card className="illustrative-card overflow-hidden">
          <div className="p-4 border-b bg-stone-50/50 flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search transactions..." 
                className="pl-10" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No transactions found.</TableCell></TableRow>
              ) : (
                filtered.sort((a,b) => b.date - a.date).map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{format(tx.date, 'MMM dd, yyyy')}</TableCell>
                    <TableCell className="font-medium">{tx.category}</TableCell>
                    <TableCell className="text-muted-foreground">{tx.description}</TableCell>
                    <TableCell className={`text-right font-bold ${tx.type === 'income' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {tx.type === 'income' ? '+' : '-'} Rp {tx.amount.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}