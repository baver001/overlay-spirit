
import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { FREE_ITEMS_PREVIEW_LIMIT, OverlaySetSummary } from '@/lib/overlayData';
import { Lock } from 'lucide-react';

interface OverlaySetGridProps {
  sets: OverlaySetSummary[];
  onAddOverlay: (type: 'css' | 'image', value: string) => void;
}

const OverlaySetGrid: React.FC<OverlaySetGridProps> = ({ sets, onAddOverlay }) => {
  if (!sets.length) {
    return (
      <div className="px-4 py-6 text-sm text-muted-foreground">
        Нет доступных наборов. Добавьте их через админ-панель.
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
              <LockedItemsNotice isPaid={set.isPaid} />
              <OverlaysPreview overlays={set.previewOverlays} onAddOverlay={onAddOverlay} />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

interface LockedItemsNoticeProps {
  isPaid: boolean;
}

const LockedItemsNotice: React.FC<LockedItemsNoticeProps> = ({ isPaid }) => {
  if (!isPaid) return null;
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
      <Lock className="w-3 h-3" />
      Часть элементов может быть доступна только после покупки.
    </div>
  );
};

interface OverlaysPreviewProps {
  overlays: OverlaySetSummary['previewOverlays'];
  onAddOverlay: (type: 'css' | 'image', value: string) => void;
}

const OverlaysPreview: React.FC<OverlaysPreviewProps> = ({ overlays, onAddOverlay }) => {
  if (!overlays?.length) {
    return <div className="text-xs text-muted-foreground">В этом наборе пока нет оверлеев.</div>;
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {overlays.map((overlay, index) => {
        const isPreview = index < FREE_ITEMS_PREVIEW_LIMIT;
        return (
          <button
            key={overlay.id}
            onClick={() => isPreview && onAddOverlay(overlay.kind, overlay.value)}
            className={`w-full relative overflow-hidden border border-border rounded-md ${
              isPreview ? 'hover:border-primary transition-colors cursor-pointer' : 'opacity-60 cursor-not-allowed'
            }`}
            style={{ aspectRatio: '3/2' }}
            disabled={!isPreview}
          >
            <div
              className="absolute inset-0"
              style={{
                background: overlay.kind === 'css' ? overlay.value : undefined,
                backgroundImage: overlay.kind === 'image' ? `url(${overlay.value})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            {!isPreview && (
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
