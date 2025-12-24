import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
export function GlobalLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 space-y-4">
      <Skeleton className="h-12 w-48" />
      <Skeleton className="h-64 w-full max-w-4xl" />
      <p className="text-sm text-muted-foreground animate-pulse text-center">Memuat Platform MasjidHub...</p>
    </div>
  );
}