import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import OverlayCategoryNav from './OverlayCategoryNav';
import OverlaySetGrid from './OverlaySetGrid';
import OverlayEditor from './OverlayEditor';
import { Overlay, OverlayCatalogSnapshot, OverlaySetWithAssets } from '@/lib/types';
import { mockApi } from '@/lib/mockApi';
import { Skeleton } from '@/components/ui/skeleton';

interface OverlaysPanelProps {
  onAddOverlay: (type: 'css' | 'image', value: string) => void;
  selectedOverlay?: Overlay;
  onUpdateOverlay?: (id: string, newProps: Partial<Overlay>) => void;
  onDeleteOverlay?: (id: string) => void;
}

type CatalogCategoryOption = {
  id: string;
  name: string;
  sets: OverlaySetWithAssets[];
};

const buildCategoryOptions = (snapshot: OverlayCatalogSnapshot | undefined): CatalogCategoryOption[] => {
  if (!snapshot) return [];

  const derived: CatalogCategoryOption[] = [];
  const allSets = [
    ...snapshot.categories.flatMap((category) => category.sets),
    ...snapshot.uncategorized,
  ];

  if (allSets.length > 0) {
    derived.push({ id: 'all', name: 'Все наборы', sets: allSets });
  }

  snapshot.categories.forEach((category) => {
    derived.push({ id: category.id, name: category.name, sets: category.sets });
  });

  if (snapshot.uncategorized.length > 0) {
    derived.push({ id: 'uncategorized', name: 'Без рубрики', sets: snapshot.uncategorized });
  }

  return derived;
};

const OverlaysPanel: React.FC<OverlaysPanelProps> = ({
  onAddOverlay,
  selectedOverlay,
  onUpdateOverlay,
  onDeleteOverlay,
}) => {
  const [activeCategoryId, setActiveCategoryId] = useState<string>('');

  const catalogQuery = useQuery({
    queryKey: ['catalog-library'],
    queryFn: () => mockApi.listCatalog({ includeInactive: false }),
  });

  const categoryOptions = useMemo(() => buildCategoryOptions(catalogQuery.data), [catalogQuery.data]);

  useEffect(() => {
    if (categoryOptions.length === 0) {
      setActiveCategoryId('');
      return;
    }

    setActiveCategoryId((current) => {
      if (current && categoryOptions.some((option) => option.id === current)) {
        return current;
      }
      return categoryOptions[0].id;
    });
  }, [categoryOptions]);

  const activeCategory = categoryOptions.find((option) => option.id === activeCategoryId);
  const showEditor = Boolean(selectedOverlay && onUpdateOverlay && onDeleteOverlay);

  return (
    <div className="flex h-full flex-col bg-background/70 backdrop-blur">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold">Оверлеи</h3>
      </div>

      {categoryOptions.length > 0 ? (
        <OverlayCategoryNav
          categories={categoryOptions.map((option) => ({ id: option.id, name: option.name }))}
          activeCategory={activeCategoryId}
          onCategoryChange={setActiveCategoryId}
        />
      ) : (
        <div className="border-b border-border px-4 py-3">
          <p className="text-xs text-muted-foreground">Каталог пока пуст. Добавьте наборы в админ-панели.</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto py-2">
        {catalogQuery.isLoading ? (
          <div className="space-y-3 px-4">
            {[0, 1, 2].map((key) => (
              <div key={key} className="space-y-2 rounded-lg border border-border p-3">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-24 w-full" />
              </div>
            ))}
          </div>
        ) : catalogQuery.isError ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
            Не удалось загрузить каталог оверлеев. Попробуйте обновить страницу.
          </div>
        ) : activeCategory ? (
          <OverlaySetGrid sets={activeCategory.sets} onAddOverlay={onAddOverlay} />
        ) : (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
            В доступных категориях нет активных наборов.
          </div>
        )}
      </div>

      {showEditor && selectedOverlay && onUpdateOverlay && onDeleteOverlay && (
        <div className="border-t border-border">
          <OverlayEditor overlay={selectedOverlay} onUpdate={onUpdateOverlay} onDelete={onDeleteOverlay} />
        </div>
      )}
    </div>
  );
};

export default OverlaysPanel;
