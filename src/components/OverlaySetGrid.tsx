import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { OverlayAsset, OverlaySetWithAssets } from '@/lib/types';
import { Lock } from 'lucide-react';

interface OverlaySetGridProps {
  sets: OverlaySetWithAssets[];
  onAddOverlay: (type: 'css' | 'image', value: string) => void;
}

const OverlayPreview: React.FC<{
  overlay: OverlayAsset;
  locked: boolean;
  onSelect: (overlay: OverlayAsset) => void;
}> = ({ overlay, locked, onSelect }) => {
  return (
    <button
      type="button"
      onClick={() => !locked && onSelect(overlay)}
      className={`relative flex aspect-[3/2] w-full overflow-hidden rounded-md border border-border transition ${
        locked ? 'cursor-not-allowed opacity-50' : 'hover:border-primary hover:shadow-lg'
      }`}
      disabled={locked}
    >
      <div
        className="absolute inset-0"
        style={{
          background: overlay.kind === 'css' ? overlay.value : undefined,
          backgroundImage: overlay.kind === 'image' ? `url(${overlay.value})` : undefined,
          backgroundPosition: 'center',
          backgroundSize: overlay.kind === 'image' ? 'cover' : '200% 200%',
        }}
      />
      {locked && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/70">
          <Lock className="h-4 w-4 text-foreground" />
        </div>
      )}
    </button>
  );
};

const OverlaySetGrid: React.FC<OverlaySetGridProps> = ({ sets, onAddOverlay }) => {
  if (!sets.length) {
    return (
      <div className="px-4 py-6 text-center text-sm text-muted-foreground">
        Наборы оверлеев пока не добавлены. Создайте их в админ-панели.
      </div>
    );
  }

  return (
    <div className="px-2">
      <Accordion type="multiple" className="w-full space-y-2">
        {sets.map((set) => {
          const overlays = set.overlays;
          const unlockedCount = set.isPaid ? Math.min(3, overlays.length) : overlays.length;
          const priceLabel =
            set.isPaid && set.priceCents !== undefined
              ? (set.priceCents / 100).toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })
              : null;

          return (
            <AccordionItem key={set.id} value={set.id} className="rounded-lg border border-border bg-background/80">
              <AccordionTrigger className="px-3 py-2 text-sm font-medium hover:no-underline">
                <div className="flex w-full items-center justify-between gap-3 text-left">
                  <div className="flex flex-col">
                    <span>{set.title}</span>
                    {set.description && <span className="text-xs font-normal text-muted-foreground">{set.description}</span>}
                  </div>
                  <Badge variant={set.isPaid ? 'default' : 'secondary'} className="shrink-0">
                    {set.isPaid ? priceLabel ?? 'Платный' : 'Бесплатно'}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 px-3 pb-4">
                {set.coverImageUrl && (
                  <div className="overflow-hidden rounded-md border border-border">
                    <img
                      src={set.coverImageUrl}
                      alt={set.title}
                      className="h-32 w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {overlays.map((overlay, index) => {
                    const locked = index >= unlockedCount;
                    return (
                      <OverlayPreview
                        key={overlay.id}
                        overlay={overlay}
                        locked={locked}
                        onSelect={(candidate) => onAddOverlay(candidate.kind, candidate.value)}
                      />
                    );
                  })}
                  {overlays.length === 0 && (
                    <div className="col-span-full rounded-md border border-dashed border-border px-4 py-6 text-center text-xs text-muted-foreground">
                      В наборе нет активных оверлеев.
                    </div>
                  )}
                </div>

                {set.isPaid && overlays.length > unlockedCount && (
                  <div className="border-t border-border pt-3 text-center">
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full max-w-sm justify-center bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                      disabled
                    >
                      {priceLabel ? `Приобрести набор за ${priceLabel}` : 'Приобрести набор'}
                    </Button>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Доступно {overlays.length - unlockedCount} премиальных оверлеев после покупки.
                    </p>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
};

export default OverlaySetGrid;
