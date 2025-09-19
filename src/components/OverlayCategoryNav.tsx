
import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface OverlayCategoryNavProps {
  categories: Array<{ id: string; name: string }>;
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

const categoryColors = [
  'bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30',
  'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30',
  'bg-gradient-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30',
  'bg-gradient-to-r from-orange-500/20 to-red-500/20 hover:from-orange-500/30 hover:to-red-500/30',
  'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 hover:from-indigo-500/30 hover:to-purple-500/30',
  'bg-gradient-to-r from-teal-500/20 to-blue-500/20 hover:from-teal-500/30 hover:to-blue-500/30',
];

const activeCategoryColors = [
  'bg-gradient-to-r from-purple-500 to-pink-500',
  'bg-gradient-to-r from-blue-500 to-cyan-500',
  'bg-gradient-to-r from-green-500 to-emerald-500',
  'bg-gradient-to-r from-orange-500 to-red-500',
  'bg-gradient-to-r from-indigo-500 to-purple-500',
  'bg-gradient-to-r from-teal-500 to-blue-500',
];

const OverlayCategoryNav: React.FC<OverlayCategoryNavProps> = ({ 
  categories, 
  activeCategory, 
  onCategoryChange 
}) => {
  return (
    <div className="grid grid-cols-3 gap-2 p-3 border-b border-border">
      {categories.map((category, index) => (
        <Button
          key={category.id}
          variant="ghost"
          size="sm"
          onClick={() => onCategoryChange(category.id)}
          className={cn(
            "text-xs font-medium transition-all h-7 px-2",
            activeCategory === category.id 
              ? `${activeCategoryColors[index % activeCategoryColors.length]} text-white hover:opacity-90`
              : categoryColors[index % categoryColors.length]
          )}
        >
          {category.name}
        </Button>
      ))}
    </div>
  );
};

export default OverlayCategoryNav;
