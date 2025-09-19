import React from 'react';
import { Overlay } from "@/lib/types";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Trash, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface OverlaySettingsModalProps {
  overlay: Overlay;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, newProps: Partial<Overlay>) => void;
  onDelete: (id: string) => void;
}

const blendModes: Array<{ value: Overlay['blendMode']; label: string }> = [
  { value: 'normal', label: 'Normal' },
  { value: 'screen', label: 'Screen' },
  { value: 'multiply', label: 'Multiply' },
  { value: 'overlay', label: 'Overlay' },
  { value: 'soft-light', label: 'Soft Light' },
  { value: 'hard-light', label: 'Hard Light' },
  { value: 'color-dodge', label: 'Color Dodge' },
  { value: 'color-burn', label: 'Color Burn' },
  { value: 'difference', label: 'Difference' },
  { value: 'exclusion', label: 'Exclusion' },
];

const OverlaySettingsModal: React.FC<OverlaySettingsModalProps> = ({ 
  overlay, 
  isOpen, 
  onClose, 
  onUpdate, 
  onDelete 
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-background/70 backdrop-blur shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Настройки слоя
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium">Прозрачность</label>
              <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
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

          <div>
            <label className="text-sm font-medium mb-2 block">Режим наложения</label>
            <Select
              value={overlay.blendMode}
              onValueChange={(value: Overlay['blendMode']) => onUpdate(overlay.id, { blendMode: value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Выберите режим наложения" />
              </SelectTrigger>
              <SelectContent>
                {blendModes.map(mode => (
                  <SelectItem key={mode.value} value={mode.value}>
                    {mode.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium">Масштаб</label>
              <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                {overlay.scale.toFixed(2)}x
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

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium">Поворот</label>
              <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                {Math.round(overlay.rotation)}°
              </span>
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

          <div className="pt-4 border-t">
            <Button 
              variant="destructive" 
              className="w-full" 
              onClick={() => {
                onDelete(overlay.id);
                onClose();
              }}
            >
              <Trash className="mr-2 h-4 w-4" />
              Удалить слой
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OverlaySettingsModal;
