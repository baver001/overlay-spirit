
import React from 'react';
import OverlaysPanel from './OverlaysPanel';
import { Overlay } from '@/lib/types';
import { cn } from '@/lib/utils';

interface SidebarProps {
  onAddOverlay: (type: 'css' | 'image', value: string) => void;
  selectedOverlay?: Overlay;
  onUpdateOverlay?: (id: string, newProps: Partial<Overlay>) => void;
  onDeleteOverlay?: (id: string) => void;
  className?: string;
  mobile?: boolean;
}

const Sidebar: React.FC<SidebarProps> = React.memo(({
  onAddOverlay,
  selectedOverlay,
  onUpdateOverlay,
  onDeleteOverlay,
  className,
  mobile = false,
}) => {
  return (
    <aside
      className={cn(
        'flex h-full flex-col bg-background',
        mobile ? 'w-full overflow-y-auto' : 'hidden border-r border-border md:flex md:w-80 md:min-w-[320px] lg:w-96',
        className,
      )}
    >
      <OverlaysPanel
        onAddOverlay={onAddOverlay}
        selectedOverlay={selectedOverlay}
        onUpdateOverlay={onUpdateOverlay}
        onDeleteOverlay={onDeleteOverlay}
      />
    </aside>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;
