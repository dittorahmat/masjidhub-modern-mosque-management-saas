import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function ZisEntryForm({ type }: { type: 'in' | 'out' }) {
  return (
    <form className="space-y-5 pt-2">
      <div className="space-y-2">
        <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Tipe ZIS</Label>
        <Select name="type" defaultValue="zakat_fitrah">
          <SelectTrigger className="h-12 md:h-14 rounded-xl border-2 focus:ring-emerald-500 font-bold">
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
        <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">
          {type === 'in' ? 'Nama Muzakki' : 'Pilih Mustahik'}
        </Label>
        <Input
          name="name"
          required
          placeholder={type === 'in' ? 'Hamba Allah' : 'Pilih dari database'}
          className="h-12 md:h-14 rounded-xl border-2 focus:ring-emerald-500 font-bold"
        />
      </div>
      <div className="space-y-2">
        <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Jumlah (Rp)</Label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-stone-300">Rp</span>
          <Input
            name="amount"
            type="number"
            required
            placeholder="0"
            className="h-12 md:h-14 rounded-xl border-2 pl-12 focus:ring-emerald-500 font-black text-lg md:text-xl tracking-tighter"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Keterangan</Label>
        <Input
          name="description"
          placeholder="Contoh: Zakat Maal periode 2024"
          className="h-12 md:h-14 rounded-xl border-2 focus:ring-emerald-500"
        />
      </div>
      <Button
        type="submit"
        className="w-full h-14 md:h-16 text-base md:text-lg rounded-full font-black bg-emerald-600 hover:bg-emerald-700 mt-4 shadow-xl shadow-emerald-200"
      >
        Simpan Data Transaksi
      </Button>
    </form>
  );
}

export function MustahikForm() {
  return (
    <form className="space-y-5 pt-2">
      <div className="space-y-2">
        <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Nama Lengkap</Label>
        <Input
          name="name"
          required
          placeholder="Nama Lengkap Mustahik"
          className="h-12 md:h-14 rounded-xl border-2 focus:ring-primary font-bold"
        />
      </div>
      <div className="space-y-2">
        <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Kategori Asnaf</Label>
        <Select name="category" defaultValue="miskin">
          <SelectTrigger className="h-12 md:h-14 rounded-xl border-2 focus:ring-primary font-bold">
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
        <Input
          name="phone"
          placeholder="0812..."
          className="h-12 md:h-14 rounded-xl border-2 focus:ring-primary"
        />
      </div>
      <div className="space-y-2">
        <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Alamat Lengkap</Label>
        <Input
          name="address"
          placeholder="Contoh: Jl. Ahmad Yani No. 123"
          className="h-12 md:h-14 rounded-xl border-2 focus:ring-primary"
        />
      </div>
      <Button
        type="submit"
        className="w-full h-14 md:h-16 text-base md:text-lg rounded-full font-black bg-primary hover:bg-primary/90 mt-4 shadow-xl shadow-primary/20"
      >
        Daftarkan Mustahik Baru
      </Button>
    </form>
  );
}
