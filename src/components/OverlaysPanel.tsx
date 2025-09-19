import React, { useState } from 'react';
import { overlayCategories } from '@/lib/overlayData';
import OverlayCategoryNav from './OverlayCategoryNav';
import OverlaySetGrid from './OverlaySetGrid';
import OverlayEditor from './OverlayEditor';
import { Overlay } from '@/lib/types';

interface OverlaysPanelProps {
  onAddOverlay: (type: 'css' | 'image', value: string) => void;
  selectedOverlay?: Overlay;
  onUpdateOverlay?: (id: string, newProps: Partial<Overlay>) => void;
  onDeleteOverlay?: (id: string) => void;
}

const OverlaysPanel: React.FC<OverlaysPanelProps> = ({ 
  onAddOverlay, 
  selectedOverlay, 
  onUpdateOverlay, 
  onDeleteOverlay 
}) => {
  const [activeCategory, setActiveCategory] = useState(overlayCategories[0]?.id || '');
  
  const currentCategory = overlayCategories.find(cat => cat.id === activeCategory);

  // Показываем редактор если есть выбранный оверлей И функции для его редактирования
  const showEditor = selectedOverlay && onUpdateOverlay && onDeleteOverlay;

  console.log('OverlaysPanel - selectedOverlay:', selectedOverlay);
  console.log('OverlaysPanel - showEditor:', showEditor);

  return (
    <div className="h-full flex flex-col bg-background/70 backdrop-blur scrollbar-hide">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold">Оверлеи</h3>
      </div>
      
      <OverlayCategoryNav
        categories={overlayCategories.map(cat => ({ id: cat.id, name: cat.name }))}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />
      
      <div className="flex-1 overflow-y-auto py-2 scrollbar-hide" style={{scrollbarWidth:'none'}}>
        {currentCategory && (
          <OverlaySetGrid
            sets={currentCategory.sets}
            onAddOverlay={onAddOverlay}
          />
        )}
      </div>

      {showEditor && (
        <div className="border-t border-border">
          <OverlayEditor
            overlay={selectedOverlay}
            onUpdate={onUpdateOverlay}
            onDelete={onDeleteOverlay}
          />
        </div>
      )}
    </div>
  );
};

export default OverlaysPanel;
