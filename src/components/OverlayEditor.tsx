import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, RotateCcw, FlipHorizontal, FlipVertical } from 'lucide-react';
import { Overlay } from '@/lib/types';
import { BLEND_MODES } from '@/lib/constants';
import { useTranslation } from 'react-i18next';

interface OverlayEditorProps {
  overlay: Overlay;
  onUpdate: (id: string, newProps: Partial<Overlay>) => void;
  onDelete: (id: string) => void;
}

const OverlayEditor: React.FC<OverlayEditorProps> = ({ 
  overlay, 
  onUpdate, 
  onDelete 
}) => {
  const { t } = useTranslation();

  return (
    <div className="p-4 space-y-5 bg-background relative z-50">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{t('editor.editor_title')}</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(overlay.id)}
          className="h-9 w-9 p-0 text-destructive hover:bg-destructive/10 rounded-md"
          title={t('editor.remove')}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-5">
        {/* Opacity */}
        <div>
          <div className="flex justify-between items-center mb-2.5">
            <label className="text-xs font-medium">{t('editor.opacity')}</label>
            <span className="text-xs text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-sm tabular-nums">
              {Math.round(overlay.opacity * 100)}%
            </span>
          </div>
          <Slider
            value={[overlay.opacity]}
            onValueChange={([value]) => onUpdate(overlay.id, { opacity: value })}
            min={0}
            max={1}
            step={0.01}
            className="w-full"
          />
        </div>

        {/* Scale */}
        <div>
          <div className="flex justify-between items-center mb-2.5">
            <label className="text-xs font-medium">{t('editor.scale')}</label>
            <span className="text-xs text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-sm tabular-nums">
              {Math.round(overlay.scale * 100)}%
            </span>
          </div>
          <Slider
            value={[overlay.scale]}
            onValueChange={([value]) => onUpdate(overlay.id, { scale: value })}
            min={0.1}
            max={3}
            step={0.01}
            className="w-full"
          />
        </div>

        {/* Rotation */}
        <div>
          <div className="flex justify-between items-center mb-2.5">
            <label className="text-xs font-medium">{t('editor.rotation')}</label>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-sm tabular-nums">
                {Math.round(overlay.rotation)}°
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onUpdate(overlay.id, { rotation: 0 })}
                className="h-7 w-7 p-0 rounded-sm"
              >
                <RotateCcw className="w-3 h-3" />
              </Button>
            </div>
          </div>
          <Slider
            value={[overlay.rotation]}
            onValueChange={([value]) => onUpdate(overlay.id, { rotation: value })}
            min={0}
            max={360}
            step={1}
            className="w-full"
          />
        </div>

        {/* Blend Mode */}
        <div>
          <label className="text-xs font-medium mb-2.5 block">{t('editor.blend_mode')}</label>
          <Select
            value={overlay.blendMode}
            onValueChange={(value: Overlay['blendMode']) => onUpdate(overlay.id, { blendMode: value })}
          >
            <SelectTrigger
              className="w-full h-9 text-xs rounded-md"
              onWheel={(e) => {
                e.preventDefault();
                const idx = BLEND_MODES.findIndex(m => m.value === overlay.blendMode);
                if (idx < 0) return;
                if (e.deltaY > 0) {
                  const next = BLEND_MODES[(idx + 1) % BLEND_MODES.length];
                  onUpdate(overlay.id, { blendMode: next.value });
                } else if (e.deltaY < 0) {
                  const prev = BLEND_MODES[(idx - 1 + BLEND_MODES.length) % BLEND_MODES.length];
                  onUpdate(overlay.id, { blendMode: prev.value });
                }
              }}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BLEND_MODES.map((mode) => (
                <SelectItem key={mode.value} value={mode.value} className="text-xs">
                  {t(`blend_modes.${mode.value}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Flip */}
        <div>
          <label className="text-xs font-medium mb-2.5 block">{t('editor.flip')}</label>
          <div className="flex gap-2">
            <Button
              variant={overlay.flipH ? "default" : "outline"}
              size="sm"
              onClick={() => onUpdate(overlay.id, { flipH: !overlay.flipH })}
              className="flex-1 h-9 text-xs rounded-md"
            >
              <FlipHorizontal className="w-3.5 h-3.5 mr-1.5" />
              {t('editor.flip_h')}
            </Button>
            <Button
              variant={overlay.flipV ? "default" : "outline"}
              size="sm"
              onClick={() => onUpdate(overlay.id, { flipV: !overlay.flipV })}
              className="flex-1 h-9 text-xs rounded-md"
            >
              <FlipVertical className="w-3.5 h-3.5 mr-1.5" />
              {t('editor.flip_v')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverlayEditor;
