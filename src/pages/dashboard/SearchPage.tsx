import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search as SearchIcon, Calendar, Package, MessageSquare, Wallet, HeartPulse } from 'lucide-react';
import type { Transaction, InventoryItem, Event, ForumPost, ZisTransaction } from '@shared/types';

interface SearchResults {
  transactions: Transaction[];
  inventory: InventoryItem[];
  events: Event[];
  forum: ForumPost[];
  zis: ZisTransaction[];
}

export default function SearchPage() {
  const { slug } = useParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  // Debounce search term to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: results, isLoading, isError } = useQuery({
    queryKey: ['search', slug, debouncedSearchTerm],
    queryFn: () => 
      debouncedSearchTerm 
        ? api<SearchResults>(`/api/${slug}/search?q=${encodeURIComponent(debouncedSearchTerm)}`)
        : Promise.resolve({ transactions: [], inventory: [], events: [], forum: [], zis: [] }),
    enabled: debouncedSearchTerm.length > 2,
  });

  const hasResults = results && (
    results.transactions.length > 0 ||
    results.inventory.length > 0 ||
    results.events.length > 0 ||
    results.forum.length > 0 ||
    results.zis.length > 0
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12 space-y-8 animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-display font-bold">Pencarian Global</h1>
          <p className="text-muted-foreground">Cari informasi di seluruh modul masjid Anda.</p>
        </div>

        <div className="max-w-2xl">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Cari transaksi, inventaris, acara, forum, dan lainnya..."
              className="pl-10 h-12 rounded-xl bg-stone-50 border-2"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Mencari...</p>
          </div>
        )}

        {isError && (
          <div className="text-center py-12">
            <p className="text-destructive">Terjadi kesalahan saat mencari</p>
          </div>
        )}

        {!isLoading && !isError && debouncedSearchTerm.length > 0 && !hasResults && (
          <div className="text-center py-12">
            <SearchIcon className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
            <h3 className="mt-4 text-lg font-medium">Tidak ditemukan hasil</h3>
            <p className="text-muted-foreground mt-2">
              Tidak ada hasil yang cocok dengan "{debouncedSearchTerm}"
            </p>
          </div>
        )}

        {hasResults && results && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Transactions */}
            {results.transactions.length > 0 && (
              <Card className="illustrative-card">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Wallet className="h-5 w-5" />
                    Transaksi
                    <Badge variant="secondary" className="ml-auto">
                      {results.transactions.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {results.transactions.map((item) => (
                    <div key={item.id} className="p-3 rounded-lg border bg-card">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{item.description}</h4>
                          <p className="text-sm text-muted-foreground">{item.category}</p>
                        </div>
                        <span className={`text-sm font-medium ${item.type === 'income' ? 'text-emerald-600' : 'text-destructive'}`}>
                          {item.type === 'income' ? '+' : '-'}Rp{item.amount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Inventory */}
            {results.inventory.length > 0 && (
              <Card className="illustrative-card">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Package className="h-5 w-5" />
                    Inventaris
                    <Badge variant="secondary" className="ml-auto">
                      {results.inventory.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {results.inventory.map((item) => (
                    <div key={item.id} className="p-3 rounded-lg border bg-card">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{item.name}</h4>
                          <p className="text-sm text-muted-foreground">Jumlah: {item.quantity}</p>
                        </div>
                        <span className="text-sm text-muted-foreground capitalize">{item.condition}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Events */}
            {results.events.length > 0 && (
              <Card className="illustrative-card">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="h-5 w-5" />
                    Kegiatan
                    <Badge variant="secondary" className="ml-auto">
                      {results.events.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {results.events.map((item) => (
                    <div key={item.id} className="p-3 rounded-lg border bg-card">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{item.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(item.date).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                        <span className="text-sm text-muted-foreground">{item.capacity} peserta</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Forum */}
            {results.forum.length > 0 && (
              <Card className="illustrative-card">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MessageSquare className="h-5 w-5" />
                    Forum
                    <Badge variant="secondary" className="ml-auto">
                      {results.forum.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {results.forum.map((item) => (
                    <div key={item.id} className="p-3 rounded-lg border bg-card">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{item.title}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">{item.content}</p>
                        </div>
                        <span className="text-xs text-muted-foreground capitalize">{item.category}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* ZIS */}
            {results.zis.length > 0 && (
              <Card className="illustrative-card lg:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <HeartPulse className="h-5 w-5" />
                    ZIS
                    <Badge variant="secondary" className="ml-auto">
                      {results.zis.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {results.zis.map((item) => (
                    <div key={item.id} className="p-3 rounded-lg border bg-card">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{item.description}</h4>
                          <p className="text-sm text-muted-foreground capitalize">{item.type}</p>
                        </div>
                        <span className="text-sm font-medium text-emerald-600">
                          Rp{item.amount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {!isLoading && !isError && debouncedSearchTerm.length > 0 && hasResults && (
          <div className="text-center text-sm text-muted-foreground">
            Menampilkan hasil pencarian untuk "{debouncedSearchTerm}"
          </div>
        )}
      </div>
    </div>
  );
}