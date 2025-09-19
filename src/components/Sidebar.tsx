
import React from 'react';
import OverlaysPanel from './OverlaysPanel';
import { Overlay } from '@/lib/types';

interface SidebarProps {
  onAddOverlay: (type: 'css' | 'image', value: string) => void;
  selectedOverlay?: Overlay;
  onUpdateOverlay?: (id: string, newProps: Partial<Overlay>) => void;
  onDeleteOverlay?: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = React.memo(({ 
  onAddOverlay, 
  selectedOverlay, 
  onUpdateOverlay, 
  onDeleteOverlay 
}) => {
  return (
    <aside className="w-[340px] fixed top-16 left-0 bottom-0 border-r border-border flex flex-col z-10 bg-background">
      <div className="flex-grow overflow-hidden">
        <OverlaysPanel 
          onAddOverlay={onAddOverlay}
          selectedOverlay={selectedOverlay}
          onUpdateOverlay={onUpdateOverlay}
          onDeleteOverlay={onDeleteOverlay}
        />
      </div>
    </aside>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;
