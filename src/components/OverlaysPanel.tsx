import React, { useMemo, useState, useRef, useCallback } from 'react';
import OverlayCategoryNav from './OverlayCategoryNav';
import OverlaySetGrid from './OverlaySetGrid';
import { Overlay } from '@/lib/types';
import { useQuery } from '@tanstack/react-query';
import { OverlaysCatalogResponse, MOCK_CATALOG } from '@/lib/overlayData';
import { Spinner } from './ui/spinner';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

// В dev-режиме используем моковые данные при ошибке API
const USE_MOCK_ON_ERROR = import.meta.env.DEV;

interface OverlaysPanelProps {
  onAddOverlay: (type: 'css' | 'image', value: string, blendMode?: string) => void;
  selectedOverlay?: Overlay;
  onUpdateOverlay?: (id: string, newProps: Partial<Overlay>) => void;
  onDeleteOverlay?: (id: string) => void;
  hideHeader?: boolean;
  onExpandRequest?: () => void;
  onCollapseRequest?: () => void;
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
  hideHeader = false,
  onExpandRequest,
  onCollapseRequest,
}) => {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['overlay-catalog'],
    queryFn: fetchCatalog,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });

  // В dev-режиме при ошибке используем моковые данные для настройки дизайна
  const catalogData = (isError && USE_MOCK_ON_ERROR) ? MOCK_CATALOG : data;
  const categories = catalogData?.categories ?? [];
  const [activeCategory, setActiveCategory] = useState(() => categories[0]?.id ?? '');
  
  // Ref для скролла
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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
    return catalogData?.setsByCategory?.[activeCategory] ?? [];
  }, [activeCategory, catalogData?.setsByCategory]);

  // При смене категории скроллим наверх
  const handleCategoryChange = useCallback((categoryId: string) => {
    setActiveCategory(categoryId);
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="h-full flex flex-col bg-background/70 backdrop-blur">
      {/* Заголовок — только на десктопе */}
      {!hideHeader && (
        <div className="px-4 py-3.5 border-b border-border/60">
          <h3 className="text-sm font-semibold">{t('editor.overlays')}</h3>
        </div>
      )}

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Spinner className="w-6 h-6 text-muted-foreground" />
        </div>
      ) : (
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto scrollbar-hide" 
          style={{ scrollbarWidth: 'none' }}
        >
          {/* Категории — всегда видны на десктопе */}
          {!hideHeader && (
            <OverlayCategoryNav
              categories={categories.map((cat) => {
                // Получаем первый оверлей первого набора для превью категории
                const sets = catalogData?.setsByCategory?.[cat.id] ?? [];
                const firstOverlay = sets[0]?.previewOverlays?.[0];
                let previewUrl: string | undefined;
                if (firstOverlay?.kind === 'image' && firstOverlay.value) {
                  previewUrl = firstOverlay.value.startsWith('overlays/')
                    ? `/api/files/${firstOverlay.value}?thumb=1&w=120&h=80&q=60`
                    : firstOverlay.value;
                }
                return { id: cat.id, slug: cat.slug, name: cat.name, previewUrl };
              })}
              activeCategory={activeCategory}
              onCategoryChange={handleCategoryChange}
            />
          )}

          {/* Каталог наборов */}
          <div className="py-2">
            <OverlaySetGrid
              sets={currentSets}
              onAddOverlay={onAddOverlay}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default OverlaysPanel;
