import React, { useMemo, useState } from 'react';
import OverlayCategoryNav from './OverlayCategoryNav';
import OverlaySetGrid from './OverlaySetGrid';
import OverlayEditor from './OverlayEditor';
import { Overlay } from '@/lib/types';
import { useQuery } from '@tanstack/react-query';
import { OverlaysCatalogResponse } from '@/lib/overlayData';
import { Spinner } from './ui/spinner';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

interface OverlaysPanelProps {
  onAddOverlay: (type: 'css' | 'image', value: string) => void;
  selectedOverlay?: Overlay;
  onUpdateOverlay?: (id: string, newProps: Partial<Overlay>) => void;
  onDeleteOverlay?: (id: string) => void;
}

async function fetchCatalog(): Promise<OverlaysCatalogResponse> {
  const resp = await fetch('/api/sets?catalog=1', { credentials: 'include' });
  if (!resp.ok) {
    throw new Error(`Failed to load catalog: ${resp.status}`);
  }
  return resp.json();
}

const OverlaysPanel: React.FC<OverlaysPanelProps> = ({
  onAddOverlay,
  selectedOverlay,
  onUpdateOverlay,
  onDeleteOverlay,
}) => {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['overlay-catalog'],
    queryFn: fetchCatalog,
    staleTime: 5 * 60 * 1000,
  });

  const categories = data?.categories ?? [];
  const [activeCategory, setActiveCategory] = useState(() => categories[0]?.id ?? '');

  React.useEffect(() => {
    if (!categories.length) {
      setActiveCategory('');
      return;
    }
    if (!categories.some((cat) => cat.id === activeCategory)) {
      setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory]);

  const currentSets = useMemo(() => {
    if (!activeCategory) return [];
    return data?.setsByCategory?.[activeCategory] ?? [];
  }, [activeCategory, data?.setsByCategory]);

  const showEditor = selectedOverlay && onUpdateOverlay && onDeleteOverlay;

  return (
    <div className="h-full flex flex-col bg-background/70 backdrop-blur scrollbar-hide">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold">Оверлеи</h3>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Spinner className="w-6 h-6 text-muted-foreground" />
        </div>
      ) : isError ? (
        <div className="p-4">
          <Alert variant="destructive">
            <AlertTitle>Не удалось загрузить каталог</AlertTitle>
            <AlertDescription>
              Проверьте подключение и попробуйте ещё раз.
              <button
                onClick={() => refetch()}
                className="ml-2 underline text-sm"
              >
                Обновить
              </button>
            </AlertDescription>
          </Alert>
        </div>
      ) : (
        <>
          <OverlayCategoryNav
            categories={categories.map((cat) => ({ id: cat.id, name: cat.name }))}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />

          <div className="flex-1 overflow-y-auto py-2 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
            <OverlaySetGrid
              sets={currentSets}
              onAddOverlay={onAddOverlay}
            />
          </div>
        </>
      )}

      {showEditor && (
        <div className="border-t border-border">
          <OverlayEditor
            overlay={selectedOverlay}
            onUpdate={onUpdateOverlay}
            onDelete={onDeleteOverlay}
          />
        </div>
      )}
    </div>
  );
};

export default OverlaysPanel;
