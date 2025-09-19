
import React from 'react';
import { Settings, Trash2, FlipHorizontal, FlipVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Overlay } from '@/lib/types';

interface OverlayControlsProps {
  overlay: Overlay;
  onUpdate: (id: string, newProps: Partial<Overlay>) => void;
  onDelete: (id: string) => void;
  onOpenSettings: () => void;
}

const OverlayControls: React.FC<OverlayControlsProps> = ({ 
  overlay, 
  onUpdate, 
  onDelete, 
  onOpenSettings 
}) => {
  return (
    <div className="absolute bottom-2 right-2 flex gap-1 bg-black/50 backdrop-blur-sm rounded-lg p-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onUpdate(overlay.id, { flipH: !overlay.flipH })}
        className={`h-8 w-8 p-0 text-white hover:bg-white/20 ${overlay.flipH ? 'bg-white/20' : ''}`}
      >
        <FlipHorizontal className="w-3 h-3" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onUpdate(overlay.id, { flipV: !overlay.flipV })}
        className={`h-8 w-8 p-0 text-white hover:bg-white/20 ${overlay.flipV ? 'bg-white/20' : ''}`}
      >
        <FlipVertical className="w-3 h-3" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onOpenSettings}
        className="h-8 w-8 p-0 text-white hover:bg-white/20"
      >
        <Settings className="w-3 h-3" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDelete(overlay.id)}
        className="h-8 w-8 p-0 text-white hover:bg-red-500/50"
      >
        <Trash2 className="w-3 h-3" />
      </Button>
    </div>
  );
};

export default OverlayControls;
