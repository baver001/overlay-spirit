
import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, RotateCcw, FlipHorizontal, FlipVertical } from 'lucide-react';
import { Overlay } from '@/lib/types';
import { BLEND_MODES } from '@/lib/constants';

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
  return (
    <div className="p-4 space-y-4 bg-background shadow-2xl relative z-50">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Редактор оверлея</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(overlay.id)}
          className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-4">
        {/* Прозрачность */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-medium">Прозрачность</label>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
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

        {/* Масштаб */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-medium">Масштаб</label>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
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

        {/* Поворот */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-medium">Поворот</label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                {Math.round(overlay.rotation)}°
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onUpdate(overlay.id, { rotation: 0 })}
                className="h-6 w-6 p-0"
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

        {/* Режим наложения */}
        <div>
          <label className="text-xs font-medium mb-2 block">Режим наложения</label>
          <Select
            value={overlay.blendMode}
            onValueChange={(value: Overlay['blendMode']) => onUpdate(overlay.id, { blendMode: value })}
          >
            <SelectTrigger className="w-full h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BLEND_MODES.map((mode) => (
                <SelectItem key={mode.value} value={mode.value} className="text-xs">
                  {mode.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Отражение */}
        <div>
          <label className="text-xs font-medium mb-2 block">Отражение</label>
          <div className="flex gap-2">
            <Button
              variant={overlay.flipH ? "default" : "outline"}
              size="sm"
              onClick={() => onUpdate(overlay.id, { flipH: !overlay.flipH })}
              className="flex-1 h-8 text-xs"
            >
              <FlipHorizontal className="w-3 h-3 mr-1" />
              По горизонтали
            </Button>
            <Button
              variant={overlay.flipV ? "default" : "outline"}
              size="sm"
              onClick={() => onUpdate(overlay.id, { flipV: !overlay.flipV })}
              className="flex-1 h-8 text-xs"
            >
              <FlipVertical className="w-3 h-3 mr-1" />
              По вертикали
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverlayEditor;
