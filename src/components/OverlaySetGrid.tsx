
import React from 'react';
import { OverlaySet } from '@/lib/overlayData';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Lock } from 'lucide-react';

interface OverlaySetGridProps {
  sets: OverlaySet[];
  onAddOverlay: (type: 'css' | 'image', value: string) => void;
}

const OverlaySetGrid: React.FC<OverlaySetGridProps> = ({ sets, onAddOverlay }) => {
  return (
    <div className="px-2">
      <Accordion type="multiple" className="w-full space-y-2">
        {sets.map((set) => (
          <AccordionItem key={set.id} value={set.id} className="border border-border rounded-lg">
            <AccordionTrigger className="px-3 py-2 text-sm font-medium hover:no-underline">
              {set.name}
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3">
              <div className="grid grid-cols-3 gap-2">
                {set.items.map((item, index) => {
                  const isFree = index < 3;
                  const isLocked = !isFree;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => !isLocked && onAddOverlay(item.type, item.value)}
                      className={`
                        w-full relative overflow-hidden border border-border
                        ${isLocked 
                          ? 'opacity-50 cursor-not-allowed' 
                          : 'hover:border-primary transition-colors cursor-pointer'
                        }
                      `}
                      style={{ aspectRatio: '3/2' }}
                      disabled={isLocked}
                    >
                      <div 
                        className="absolute inset-0" 
                        style={{ 
                          background: item.type === 'css' ? item.value : undefined,
                          backgroundImage: item.type === 'image' ? `url(${item.value})` : undefined,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }}
                      />
                      
                      {isLocked && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <Lock className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              
              {set.items.some((_, index) => index >= 3) && (
                <div className="mt-3 pt-3 border-t border-border">
                  <button className="w-full py-2 px-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-md text-xs font-medium transition-colors shadow-lg">
                    Купить этот набор ({set.items.length - 3} доп. оверлеев)
                  </button>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default OverlaySetGrid;
