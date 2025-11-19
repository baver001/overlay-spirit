
import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { FREE_ITEMS_PREVIEW_LIMIT, OverlaySetSummary } from '@/lib/overlayData';
import { Lock, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OverlaySetGridProps {
  sets: OverlaySetSummary[];
  onAddOverlay: (type: 'css' | 'image', value: string) => void;
}

const OverlaySetGrid: React.FC<OverlaySetGridProps> = ({ sets, onAddOverlay }) => {
  console.log('[OverlaySetGrid] Rendering sets:', sets);
  console.log('[OverlaySetGrid] Sets with overlays:', sets.map(set => ({
    id: set.id,
    title: set.title,
    previewOverlays: set.previewOverlays?.map(o => ({ kind: o.kind, value: o.value })) || []
  })));

  if (!sets.length) {
    return (
      <div className="px-4 py-6 text-sm text-muted-foreground">
        В этом наборе пока нет оверлеев.
      </div>
    );
  }

  return (
    <div className="px-2">
      <Accordion type="multiple" className="w-full space-y-2">
        {sets.map((set) => (
          <AccordionItem key={set.id} value={set.id} className="border border-border rounded-lg">
            <AccordionTrigger className="px-3 py-2 text-sm font-medium hover:no-underline">
              <div className="flex flex-col items-start gap-1 w-full text-left">
                <span>{set.title}</span>
                {set.description && (
                  <span className="text-xs text-muted-foreground line-clamp-2">{set.description}</span>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3">
              {set.coverImageUrl && (
                <div className="mb-3 overflow-hidden rounded-md border border-border">
                  <img
                    src={set.coverImageUrl}
                    alt={set.title}
                    className="w-full h-32 object-cover"
                  />
                </div>
              )}
              <LockedItemsNotice isPaid={set.isPaid} isPurchased={set.isPurchased} />
              {set.isPaid && !set.isPurchased && (
                <PurchaseButton setId={set.id} priceCents={set.priceCents} />
              )}
              <OverlaysPreview 
                overlays={set.previewOverlays} 
                onAddOverlay={onAddOverlay}
                isPaid={set.isPaid}
                isPurchased={set.isPurchased}
              />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

interface LockedItemsNoticeProps {
  isPaid: boolean;
  isPurchased?: boolean;
}

const LockedItemsNotice: React.FC<LockedItemsNoticeProps> = ({ isPaid, isPurchased }) => {
  if (!isPaid || isPurchased) return null;
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
      <Lock className="w-3 h-3" />
      Все элементы доступны после покупки набора.
    </div>
  );
};

interface PurchaseButtonProps {
  setId: string;
  priceCents?: number | null;
}

const PurchaseButton: React.FC<PurchaseButtonProps> = ({ setId, priceCents }) => {
  const [loading, setLoading] = React.useState(false);

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
        const error = await res.json().catch(() => ({ error: 'Ошибка при создании платежа' }));
        alert(error.error || 'Ошибка при создании платежа');
        return;
      }
      
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Не удалось получить URL для оплаты');
      }
    } catch (error: any) {
      alert('Ошибка: ' + (error.message || 'Не удалось создать платеж'));
    } finally {
      setLoading(false);
    }
  };

  const price = priceCents ? (priceCents / 100).toFixed(2) : null;

  return (
    <Button
      onClick={handlePurchase}
      disabled={loading}
      className="w-full mb-3"
      size="sm"
    >
      <ShoppingCart className="w-4 h-4 mr-2" />
      {loading ? 'Загрузка...' : price ? `Купить за $${price}` : 'Купить'}
    </Button>
  );
};

interface OverlaysPreviewProps {
  overlays: OverlaySetSummary['previewOverlays'];
  onAddOverlay: (type: 'css' | 'image', value: string) => void;
  isPaid: boolean;
  isPurchased?: boolean;
}

const OverlaysPreview: React.FC<OverlaysPreviewProps> = ({ overlays, onAddOverlay, isPaid, isPurchased }) => {
  const [loadedImages, setLoadedImages] = React.useState<Set<string>>(new Set());
  
  console.log('[OverlaysPreview] Rendering overlays:', overlays, { isPaid, isPurchased });

  if (!overlays?.length) {
    return <div className="text-xs text-muted-foreground">В этом наборе пока нет оверлеев.</div>;
  }

  const handleImageLoad = (overlayId: string) => {
    setLoadedImages(prev => new Set(prev).add(overlayId));
  };

  // Determine if overlay is accessible
  const isOverlayAccessible = (index: number) => {
    if (!isPaid) return true; // Free sets - all accessible
    if (isPurchased) return true; // Purchased sets - all accessible
    return index < FREE_ITEMS_PREVIEW_LIMIT; // Paid but not purchased - only first 3
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      {overlays.map((overlay, index) => {
        const isAccessible = isOverlayAccessible(index);
        const isLoaded = loadedImages.has(overlay.id);
        
        // Optimize thumbnail loading with query params
        let imageUrl = overlay.value;
        if (overlay.value.startsWith('overlays/')) {
          imageUrl = `/api/files/${overlay.value}?thumb=1&w=300&h=200&q=75`;
        }

        console.log('[OverlaysPreview] Overlay:', {
          index,
          kind: overlay.kind,
          value: overlay.value,
          imageUrl,
          isAccessible,
          isPaid,
          isPurchased
        });

        return (
          <button
            key={overlay.id}
            onClick={() => isAccessible && onAddOverlay(overlay.kind, overlay.value)}
            className={`w-full relative overflow-hidden border border-border rounded-md ${
              isAccessible ? 'hover:border-primary transition-colors cursor-pointer' : 'opacity-60 cursor-not-allowed'
            }`}
            style={{ aspectRatio: '3/2' }}
            disabled={!isAccessible}
            title={!isAccessible ? 'Доступно после покупки' : undefined}
          >
            {/* Skeleton loader */}
            {overlay.kind === 'image' && !isLoaded && (
              <div className="absolute inset-0 bg-muted/50 animate-pulse" />
            )}
            
            {/* Actual image/overlay */}
            {overlay.kind === 'image' ? (
              <img
                src={imageUrl}
                alt={`Overlay ${index + 1}`}
                loading="lazy"
                decoding="async"
                onLoad={() => handleImageLoad(overlay.id)}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${
                  isLoaded ? 'opacity-100' : 'opacity-0'
                }`}
              />
            ) : (
              <div
                className="absolute inset-0"
                style={{
                  background: overlay.value,
                }}
              />
            )}
            
            {!isAccessible && (
              <div className="absolute inset-0 bg-black/65 flex items-center justify-center">
                <Lock className="w-4 h-4 text-white" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default OverlaySetGrid;
