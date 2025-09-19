
import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2 } from 'lucide-react';
import { Overlay } from '@/lib/types';

interface OverlayPropertiesPanelProps {
  overlay: Overlay;
  onUpdate: (id: string, newProps: Partial<Overlay>) => void;
  onDelete: (id: string) => void;
}

const blendModes = [
  'normal', 'multiply', 'screen', 'overlay', 'soft-light', 'hard-light',
  'color-dodge', 'color-burn', 'darken', 'lighten', 'difference', 'exclusion',
  'hue', 'saturation', 'color', 'luminosity'
] as const;

const OverlayPropertiesPanel: React.FC<OverlayPropertiesPanelProps> = ({ 
  overlay, 
  onUpdate, 
  onDelete 
}) => {
  return (
    <div className="p-4 space-y-4 border-t border-border">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Настройки оверлея</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(overlay.id)}
          className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">
            Прозрачность
          </label>
          <Slider
            value={[overlay.opacity * 100]}
            onValueChange={([value]) => onUpdate(overlay.id, { opacity: value / 100 })}
            max={100}
            min={0}
            step={1}
            className="w-full"
          />
          <div className="text-xs text-muted-foreground mt-1">
            {Math.round(overlay.opacity * 100)}%
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">
            Поворот
          </label>
          <Slider
            value={[overlay.rotation]}
            onValueChange={([value]) => onUpdate(overlay.id, { rotation: value })}
            max={360}
            min={-360}
            step={1}
            className="w-full"
          />
          <div className="text-xs text-muted-foreground mt-1">
            {overlay.rotation}°
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">
            Масштаб
          </label>
          <Slider
            value={[overlay.scale * 100]}
            onValueChange={([value]) => onUpdate(overlay.id, { scale: value / 100 })}
            max={200}
            min={10}
            step={1}
            className="w-full"
          />
          <div className="text-xs text-muted-foreground mt-1">
            {Math.round(overlay.scale * 100)}%
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">
            Режим наложения
          </label>
          <Select
            value={overlay.blendMode}
            onValueChange={(value: Overlay['blendMode']) => onUpdate(overlay.id, { blendMode: value })}
          >
            <SelectTrigger className="w-full h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {blendModes.map((mode) => (
                <SelectItem key={mode} value={mode} className="text-xs">
                  {mode}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default OverlayPropertiesPanel;
