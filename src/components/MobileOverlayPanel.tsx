import React, { useState, useCallback } from 'react';
import { ChevronUp, ChevronDown, Layers, Settings2, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import OverlayCategoryNav from './OverlayCategoryNav';
import OverlaySetGrid from './OverlaySetGrid';
import OverlayEditor from './OverlayEditor';
import { Overlay } from '@/lib/types';
import { Button } from './ui/button';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { OverlaysCatalogResponse, MOCK_CATALOG } from '@/lib/overlayData';
import { Spinner } from './ui/spinner';

type PanelMode = 'collapsed' | 'categories' | 'sets' | 'editor';

interface MobileOverlayPanelProps {
  onAddOverlay: (type: 'css' | 'image', value: string) => void;
  selectedOverlay?: Overlay;
  onUpdateOverlay?: (id: string, newProps: Partial<Overlay>) => void;
  onDeleteOverlay?: (id: string) => void;
}

// В dev-режиме используем моковые данные при ошибке API
const USE_MOCK_ON_ERROR = import.meta.env.DEV;

async function fetchCatalog(): Promise<OverlaysCatalogResponse> {
  const resp = await fetch('/api/sets?catalog=1', { credentials: 'include' });
  if (!resp.ok) {
    throw new Error(`Failed to load catalog: ${resp.status}`);
  }
  return resp.json();
}

const MobileOverlayPanel: React.FC<MobileOverlayPanelProps> = ({
  onAddOverlay,
  selectedOverlay,
  onUpdateOverlay,
  onDeleteOverlay,
}) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<PanelMode>('collapsed');
  const [activeCategory, setActiveCategory] = useState<string>('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['overlay-catalog'],
    queryFn: fetchCatalog,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });

  // В dev-режиме при ошибке используем моковые данные
  const catalogData = (isError && USE_MOCK_ON_ERROR) ? MOCK_CATALOG : data;
  const categories = catalogData?.categories ?? [];

  React.useEffect(() => {
    if (categories.length && !activeCategory) {
      setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory]);

  const currentSets = React.useMemo(() => {
    if (!activeCategory) return [];
    return catalogData?.setsByCategory?.[activeCategory] ?? [];
  }, [activeCategory, catalogData?.setsByCategory]);

  const handleToggle = (targetMode: PanelMode) => {
    if (mode === targetMode && targetMode !== 'sets') {
      setMode('collapsed');
    } else {
      setMode(targetMode);
    }
  };

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId);
    setMode('sets');
  };

  const handleBackToCategories = () => {
    setMode('categories');
  };

  const isOpen = mode !== 'collapsed';

  // Вычисляем высоту панели
  const getPanelHeight = () => {
    if (!isOpen) return '0px';
    return '75vh';
  };

  const activeCategoryName = categories.find(c => c.id === activeCategory)?.name || '';

  return (
    <>
      {/* Затемнение фона при открытой панели */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/50 z-30 md:hidden transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setMode('collapsed')}
      />

      {/* Мобильная панель — всегда привязана к низу */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
        {/* Кнопки переключения — увеличенные для удобства нажатия */}
        <div className="flex items-center justify-center gap-2.5 px-3 py-2.5 bg-background/95 backdrop-blur-lg border-t border-border/60">
          <button
            onClick={() => handleToggle('categories')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 h-11 text-sm font-semibold rounded-xl transition-all duration-200 text-white",
              (mode === 'categories' || mode === 'sets') 
                ? "shadow-lg ring-2 ring-white/30" 
                : "shadow-md"
            )}
            style={{
              background: 'linear-gradient(135deg, #F9AD87 0%, #F499BE 50%, #9563A1 100%)',
            }}
          >
            <Layers className="w-4 h-4" />
            {t('editor.overlays')}
            {mode === 'categories' || mode === 'sets' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          
          {selectedOverlay && onUpdateOverlay && onDeleteOverlay && (
            <Button
              variant={mode === 'editor' ? 'default' : 'outline'}
              onClick={() => handleToggle('editor')}
              className={cn(
                "flex-1 gap-2 h-11 text-sm font-medium rounded-md transition-all duration-200",
                mode === 'editor' && "shadow-md"
              )}
            >
              <Settings2 className="w-4 h-4" />
              {t('editor.editor_title')}
              {mode === 'editor' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </Button>
          )}
        </div>

        {/* Первый слой: Категории */}
        <div 
          className={cn(
            "absolute bottom-full left-0 right-0 bg-background rounded-t-2xl border-t border-border transition-all duration-300 ease-out overflow-hidden",
            mode === 'categories' ? "shadow-[0_-4px_24px_-6px_rgba(0,0,0,0.4)]" : "shadow-none"
          )}
          style={{ 
            height: mode === 'categories' ? getPanelHeight() : '0px',
            transform: mode === 'categories' ? 'translateY(0)' : 'translateY(20px)',
            opacity: mode === 'categories' ? 1 : 0,
            pointerEvents: mode === 'categories' ? 'auto' : 'none',
          }}
        >
          <div className="h-full overflow-y-auto">
            <div className="p-3 border-b border-border/60">
              <h3 className="text-sm font-semibold">{t('editor.overlays')}</h3>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner className="w-6 h-6 text-muted-foreground" />
              </div>
            ) : (
              <div className="py-3">
                <div className="grid grid-cols-3 gap-2 px-3">
                  {categories.map((category) => {
                    // Получаем первый оверлей первого набора для превью
                    const sets = catalogData?.setsByCategory?.[category.id] ?? [];
                    const firstOverlay = sets[0]?.previewOverlays?.[0];
                    let previewUrl: string | undefined;
                    if (firstOverlay?.kind === 'image' && firstOverlay.value) {
                      previewUrl = firstOverlay.value.startsWith('overlays/')
                        ? `/api/files/${firstOverlay.value}?thumb=1&w=120&h=80&q=60`
                        : firstOverlay.value;
                    }
                    
                    return (
                      <button
                        key={category.id}
                        onClick={() => handleCategoryClick(category.id)}
                        className="relative flex items-center justify-center h-20 rounded-xl border border-border/40 hover:brightness-110 active:scale-95 transition-all duration-200 overflow-hidden"
                        style={previewUrl ? {
                          backgroundImage: `url(${previewUrl})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        } : {
                          background: 'linear-gradient(135deg, rgba(249,173,135,0.3) 0%, rgba(244,153,190,0.3) 50%, rgba(149,99,161,0.3) 100%)',
                        }}
                      >
                        {/* Затемнение для читаемости */}
                        <div className="absolute inset-0 bg-black/40 rounded-xl" />
                        <span className="relative z-10 text-xs font-semibold text-white drop-shadow-sm text-center px-1">
                          {category.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Второй слой: Наборы */}
        <div 
          className={cn(
            "absolute bottom-full left-0 right-0 bg-background rounded-t-2xl border-t border-border transition-all duration-300 ease-out overflow-hidden",
            mode === 'sets' ? "shadow-[0_-6px_32px_-8px_rgba(0,0,0,0.5)]" : "shadow-none"
          )}
          style={{ 
            height: mode === 'sets' ? getPanelHeight() : '0px',
            transform: mode === 'sets' ? 'translateY(0)' : 'translateY(20px)',
            opacity: mode === 'sets' ? 1 : 0,
            pointerEvents: mode === 'sets' ? 'auto' : 'none',
            zIndex: mode === 'sets' ? 2 : 0
          }}
        >
          <div className="h-full overflow-y-auto">
            <div className="flex items-center gap-2 p-3 border-b border-border/60">
              <button
                onClick={handleBackToCategories}
                className="p-1.5 hover:bg-muted/40 rounded-md transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h3 className="text-sm font-semibold">{activeCategoryName}</h3>
            </div>
            <div className="py-2">
              <OverlaySetGrid
                sets={currentSets}
                onAddOverlay={onAddOverlay}
              />
            </div>
          </div>
        </div>

        {/* Третий слой: Редактор */}
        <div 
          className={cn(
            "absolute bottom-full left-0 right-0 bg-background rounded-t-2xl border-t border-border transition-all duration-300 ease-out overflow-hidden",
            mode === 'editor' ? "shadow-[0_-8px_40px_-10px_rgba(0,0,0,0.6)]" : "shadow-none"
          )}
          style={{ 
            height: mode === 'editor' ? getPanelHeight() : '0px',
            transform: mode === 'editor' ? 'translateY(0)' : 'translateY(20px)',
            opacity: mode === 'editor' ? 1 : 0,
            pointerEvents: mode === 'editor' ? 'auto' : 'none',
            zIndex: mode === 'editor' ? 3 : 0
          }}
        >
          <div className="h-full overflow-y-auto">
            {mode === 'editor' && selectedOverlay && onUpdateOverlay && onDeleteOverlay && (
              <div className="p-4">
                <OverlayEditor
                  overlay={selectedOverlay}
                  onUpdate={onUpdateOverlay}
                  onDelete={(id) => {
                    onDeleteOverlay(id);
                    setMode('categories');
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileOverlayPanel;
