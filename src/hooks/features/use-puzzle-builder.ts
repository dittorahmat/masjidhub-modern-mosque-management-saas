import { useState } from 'react';
import { PageSection } from '@shared/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';

export function usePuzzleBuilder(slug: string) {
  const queryClient = useQueryClient();
  const [localSections, setLocalSections] = useState<PageSection[]>([]);

  const { isLoading } = useQuery({
    queryKey: ['page-sections', slug],
    queryFn: async () => {
      const data = await api<PageSection[]>(`/api/${slug}/page/sections`);
      setLocalSections(data);
      return data;
    }
  });

  const saveMutation = useMutation({
    mutationFn: (sections: PageSection[]) => 
      api(`/api/${slug}/page/sections`, {
        method: 'POST',
        body: JSON.stringify(sections)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['page-sections', slug] });
      toast.success('Tata letak portal berhasil disimpan');
    },
    onError: () => toast.error('Gagal menyimpan tata letak')
  });

  const addSection = (type: string) => {
    const newSection: PageSection = {
      id: crypto.randomUUID(),
      tenantId: 'temp',
      type,
      order: localSections.length,
      config: {}, // Default empty config
      isVisible: true,
      updatedAt: Date.now()
    };
    setLocalSections(prev => [...prev, newSection]);
  };

  const removeSection = (id: string) => {
    setLocalSections(prev => prev.filter(s => s.id !== id));
  };

  const moveSection = (id: string, direction: 'up' | 'down') => {
    const index = localSections.findIndex(s => s.id === id);
    if (index < 0) return;
    
    const newSections = [...localSections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newSections.length) return;
    
    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
    setLocalSections(newSections.map((s, i) => ({ ...s, order: i })));
  };

  return {
    sections: localSections,
    addSection,
    removeSection,
    moveSection,
    save: () => saveMutation.mutate(localSections),
    isSaving: saveMutation.isPending,
    isLoading
  };
}
