import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { FREE_ITEMS_PREVIEW_LIMIT, OverlaySetSummary } from '@/lib/overlayData';
import { Lock, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

// Количество заглушек для дизайна (пока нет реальных оверлеев)
const PLACEHOLDER_COUNT = 25;

interface OverlaySetGridProps {
  sets: OverlaySetSummary[];
  onAddOverlay: (type: 'css' | 'image', value: string) => void;
}

// Бейдж FREE/PREMIUM — оптические отступы (padding ≈ высота текста / 2)
const SetBadge: React.FC<{ isPaid: boolean }> = ({ isPaid }) => {
  if (isPaid) {
    return (
      <span className="flex-shrink-0 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30">
        Premium
      </span>
    );
  }
  return (
    <span className="flex-shrink-0 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30">
      Free
    </span>
  );
};

// Одна заглушка SOON
const PlaceholderItem: React.FC<{ index: number }> = ({ index }) => {
  const { t } = useTranslation();
  // Разные оттенки для визуального разнообразия
  const hue = (index * 15) % 360;
  
  return (
    <div
      className="relative overflow-hidden rounded-[6px] bg-muted/20 border border-border/30"
      style={{ 
        aspectRatio: '3/2',
        background: `linear-gradient(135deg, hsl(${hue} 10% 15% / 0.3) 0%, hsl(${hue} 10% 10% / 0.2) 100%)`
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[9px] font-bold tracking-[0.2em] text-muted-foreground/40 uppercase select-none">
          {t('editor.soon')}
        </span>
      </div>
    </div>
  );
};

// Первые 3 элемента (оверлеи или заглушки)
const FirstRowItems: React.FC<{
  overlays: OverlaySetSummary['previewOverlays'];
  onAddOverlay: (type: 'css' | 'image', value: string) => void;
  isPaid: boolean;
  isPurchased?: boolean;
}> = ({ overlays, onAddOverlay, isPaid, isPurchased }) => {
  const { t } = useTranslation();
  const firstThree = overlays?.slice(0, 3) || [];
  
  const isOverlayAccessible = (index: number) => {
    if (!isPaid) return true;
    if (isPurchased) return true;
    return index < FREE_ITEMS_PREVIEW_LIMIT;
  };

  // Gap = 6px, внутренний радиус = внешний радиус карточки (16px) - padding (16px) = ~6px
  return (
    <div className="grid grid-cols-3 gap-[6px]">
      {[0, 1, 2].map((index) => {
        const overlay = firstThree[index];
        
        // Если нет оверлея — показываем заглушку
        if (!overlay) {
          return <PlaceholderItem key={`placeholder-${index}`} index={index} />;
        }
        
        const isAccessible = isOverlayAccessible(index);
        let imageUrl = overlay.value;
        if (overlay.value.startsWith('overlays/')) {
          imageUrl = `/api/files/${overlay.value}?thumb=1&w=200&h=140&q=70`;
        }

        return (
          <button
            key={overlay.id}
            onClick={(e) => {
              e.stopPropagation();
              if (isAccessible) onAddOverlay(overlay.kind, overlay.value);
            }}
            className={`relative overflow-hidden rounded-[6px] transition-all duration-200 ${
              isAccessible 
                ? 'hover:ring-2 hover:ring-primary/50 hover:scale-[1.02] cursor-pointer active:scale-[0.98]' 
                : 'opacity-50 cursor-not-allowed'
            }`}
            style={{ aspectRatio: '3/2' }}
            disabled={!isAccessible}
            title={!isAccessible ? t('editor.available_after_purchase') : t('editor.click_to_add')}
          >
            {overlay.kind === 'image' ? (
              <img
                src={imageUrl}
                alt=""
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover rounded-[6px]"
              />
            ) : (
              <div
                className="absolute inset-0 rounded-[6px]"
                style={{ background: overlay.value }}
              />
            )}
            {!isAccessible && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-[6px]">
                <Lock className="w-3 h-3 text-white/80" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};

const OverlaySetGrid: React.FC<OverlaySetGridProps> = ({ sets, onAddOverlay }) => {
  const { t } = useTranslation();

  if (!sets.length) {
    return (
      <div className="px-4 py-6 text-sm text-muted-foreground">
        {t('editor.no_overlays_in_set')}
      </div>
    );
  }

  return (
    // Внешний отступ px-3 (12px) для отступа от края sidebar
    <div className="px-3 space-y-3">
      <Accordion type="multiple" className="w-full space-y-3">
        {sets.map((set) => {
          const overlayCount = set.previewOverlays?.length || 0;
          // Всегда показываем аккордеон с 25 заглушками для дизайна
          const totalItems = Math.max(overlayCount, PLACEHOLDER_COUNT);
          const hasMoreThanThree = totalItems > 3;
          
          return (
            <AccordionItem 
              key={set.id} 
              value={set.id} 
              // Карточка: rounded-xl (16px), без border — используем тень
              className="rounded-xl overflow-hidden bg-card/40 shadow-sm border border-border/40"
            >
              {/* 
                Оптические отступы: padding = radius для гармонии
                Карточка 16px radius → внутренний padding 16px (p-4)
              */}
              <div className="p-4">
                {/* Заголовок с бейджем — отступ снизу 12px */}
                <div className="flex items-center gap-2 mb-3">
                  {/* Название с плавным обрезанием */}
                  <div className="flex-1 min-w-0 relative">
                    <span className="block text-[13px] font-semibold whitespace-nowrap overflow-hidden" style={{
                      maskImage: 'linear-gradient(to right, black 75%, transparent 100%)',
                      WebkitMaskImage: 'linear-gradient(to right, black 75%, transparent 100%)',
                    }}>
                      {set.title}
                    </span>
                  </div>
                  <SetBadge isPaid={set.isPaid} />
                </div>
                
                {/* Первые 3 элемента (оверлеи или заглушки) */}
                <FirstRowItems
                  overlays={set.previewOverlays}
                  onAddOverlay={onAddOverlay}
                  isPaid={set.isPaid}
                  isPurchased={set.isPurchased}
                />
              </div>
              
              {/* Аккордеон для остальных элементов */}
              {hasMoreThanThree && (
                <>
                  <AccordionTrigger className="px-4 py-2.5 text-xs text-muted-foreground hover:no-underline border-t border-border/30">
                    <span>{t('editor.show_more')} ({totalItems - 3})</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    {set.coverImageUrl && (
                      <div className="mb-3 overflow-hidden rounded-lg border border-border/30">
                        <img
                          src={set.coverImageUrl}
                          alt={set.title}
                          className="w-full h-24 object-cover"
                        />
                      </div>
                    )}
                    <LockedItemsNotice isPaid={set.isPaid} isPurchased={set.isPurchased} />
                    {set.isPaid && !set.isPurchased && (
                      <PurchaseButton setId={set.id} priceCents={set.priceCents} discountPriceCents={set.discountPriceCents} />
                    )}
                    {/* Остальные элементы: оверлеи + заглушки до 25 */}
                    <ExpandedOverlaysGrid 
                      overlays={set.previewOverlays?.slice(3) || []} 
                      onAddOverlay={onAddOverlay}
                      isPaid={set.isPaid}
                      isPurchased={set.isPurchased}
                      startIndex={3}
                      totalPlaceholders={PLACEHOLDER_COUNT - 3}
                    />
                  </AccordionContent>
                </>
              )}
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
};

interface LockedItemsNoticeProps {
  isPaid: boolean;
  isPurchased?: boolean;
}

const LockedItemsNotice: React.FC<LockedItemsNoticeProps> = ({ isPaid, isPurchased }) => {
  const { t } = useTranslation();
  if (!isPaid || isPurchased) return null;
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
      <Lock className="w-3 h-3" />
      {t('editor.locked_items_notice')}
    </div>
  );
};

interface PurchaseButtonProps {
  setId: string;
  priceCents?: number | null;
  discountPriceCents?: number | null;
}

const PurchaseButton: React.FC<PurchaseButtonProps> = ({ setId, priceCents, discountPriceCents }) => {
  const [loading, setLoading] = React.useState(false);
  const { t } = useTranslation();

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ set_id: setId }),
      });
      
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: t('editor.purchase_error') }));
        alert(error.error || t('editor.purchase_error'));
        return;
      }
      
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(t('editor.payment_url_error'));
      }
    } catch (error: any) {
      alert(t('common.error') + ': ' + (error.message || t('editor.purchase_error')));
    } finally {
      setLoading(false);
    }
  };

  const oldPrice = priceCents ? (priceCents / 100).toFixed(2) : null;
  const price = discountPriceCents ? (discountPriceCents / 100).toFixed(2) : oldPrice;

  return (
    <Button
      onClick={handlePurchase}
      disabled={loading}
      className="w-full mb-3 h-[44px] bg-brand-gradient hover:opacity-90 transition-opacity border-0 text-white rounded-full"
    >
      <ShoppingCart className="w-4 h-4 mr-2" />
      <div className="flex flex-col items-center">
        {oldPrice && price !== oldPrice && <span className="text-[10px] line-through opacity-70 leading-none mb-0.5">$ {oldPrice}</span>}
        <span className="font-bold leading-none">
          {loading ? t('editor.loading') : price ? `${t('editor.buy')} $${price}` : t('editor.buy')}
        </span>
      </div>
    </Button>
  );
};

interface ExpandedOverlaysGridProps {
  overlays: OverlaySetSummary['previewOverlays'];
  onAddOverlay: (type: 'css' | 'image', value: string) => void;
  isPaid: boolean;
  isPurchased?: boolean;
  startIndex?: number;
  totalPlaceholders: number;
}

const ExpandedOverlaysGrid: React.FC<ExpandedOverlaysGridProps> = ({ 
  overlays, 
  onAddOverlay, 
  isPaid, 
  isPurchased,
  startIndex = 0,
  totalPlaceholders
}) => {
  const [loadedImages, setLoadedImages] = React.useState<Set<string>>(new Set());
  const { t } = useTranslation();

  const handleImageLoad = (overlayId: string) => {
    setLoadedImages(prev => new Set(prev).add(overlayId));
  };

  const isOverlayAccessible = (index: number) => {
    const actualIndex = startIndex + index;
    if (!isPaid) return true;
    if (isPurchased) return true;
    return actualIndex < FREE_ITEMS_PREVIEW_LIMIT;
  };

  // Общее количество ячеек = реальные оверлеи + заглушки до totalPlaceholders
  const overlayCount = overlays?.length || 0;
  const placeholdersNeeded = Math.max(0, totalPlaceholders - overlayCount);
  const totalCells = overlayCount + placeholdersNeeded;

  return (
    // Gap 6px для консистентности с FirstRowItems
    <div className="grid grid-cols-3 gap-[6px]">
      {Array.from({ length: totalCells }).map((_, index) => {
        const overlay = overlays?.[index];
        
        // Если нет оверлея — показываем заглушку
        if (!overlay) {
          return <PlaceholderItem key={`placeholder-expanded-${index}`} index={startIndex + index} />;
        }
        
        const isAccessible = isOverlayAccessible(index);
        const isLoaded = loadedImages.has(overlay.id);
        
        let imageUrl = overlay.value;
        if (overlay.value.startsWith('overlays/')) {
          imageUrl = `/api/files/${overlay.value}?thumb=1&w=300&h=200&q=75`;
        }

        return (
          <button
            key={overlay.id}
            onClick={() => isAccessible && onAddOverlay(overlay.kind, overlay.value)}
            className={`w-full relative overflow-hidden rounded-[6px] transition-all duration-200 ${
              isAccessible 
                ? 'hover:ring-2 hover:ring-primary/50 hover:scale-[1.02] cursor-pointer active:scale-[0.98]' 
                : 'opacity-50 cursor-not-allowed'
            }`}
            style={{ aspectRatio: '3/2' }}
            disabled={!isAccessible}
            title={!isAccessible ? t('editor.available_after_purchase') : undefined}
          >
            {overlay.kind === 'image' && !isLoaded && (
              <div className="absolute inset-0 bg-muted/30 animate-pulse rounded-[6px]" />
            )}
            
            {overlay.kind === 'image' ? (
              <img
                src={imageUrl}
                alt={`Overlay ${startIndex + index + 1}`}
                loading="lazy"
                decoding="async"
                onLoad={() => handleImageLoad(overlay.id)}
                className={`absolute inset-0 w-full h-full object-cover rounded-[6px] transition-opacity duration-200 ${
                  isLoaded ? 'opacity-100' : 'opacity-0'
                }`}
              />
            ) : (
              <div
                className="absolute inset-0 rounded-[6px]"
                style={{ background: overlay.value }}
              />
            )}
            
            {!isAccessible && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-[6px]">
                <Lock className="w-3.5 h-3.5 text-white/80" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default OverlaySetGrid;
