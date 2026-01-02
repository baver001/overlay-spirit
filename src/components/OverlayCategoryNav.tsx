import React from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { CATEGORY_GRADIENTS } from '@/lib/constants';

interface OverlayCategoryNavProps {
  categories: Array<{ id: string; slug?: string; name: string; previewUrl?: string }>;
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

// Получить slug из id категории (cat-bokeh -> bokeh)
function getSlugFromId(id: string, slug?: string): string {
  if (slug) return slug;
  return id.replace(/^cat-/, '');
}

const OverlayCategoryNav: React.FC<OverlayCategoryNavProps> = ({
  categories,
  activeCategory,
  onCategoryChange,
}) => {
  const { t } = useTranslation();

  if (!categories.length) {
    return (
      <div className="p-4 text-xs text-muted-foreground">
        {t('editor.no_categories')}
      </div>
    );
  }

  return (
    // Сетка категорий в 3 столбца
    <div className="border-b border-border/40">
      <div className="grid grid-cols-3 gap-2 p-3 pb-4">
        {categories.map((category) => {
          const slug = getSlugFromId(category.id, category.slug);
          const gradient = CATEGORY_GRADIENTS[slug];
          const isActive = activeCategory === category.id;
          const hasPreview = !!category.previewUrl;
          
          // Если есть превью оверлея — используем его как фон
          // Иначе — градиент категории (fallback)
          const backgroundStyle: React.CSSProperties = hasPreview
            ? {
                backgroundImage: `url(${category.previewUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : gradient
              ? {
                  background: `linear-gradient(145deg, ${gradient.start} 0%, ${gradient.end} 100%)`,
                }
              : {};

          return (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={cn(
                // Базовые стили
                'relative overflow-hidden inline-flex items-center justify-center text-[11px] font-semibold transition-all duration-200 text-center',
                // Оптические отступы: radius 10px, padding горизонтальный ~10px
                'rounded-[10px] px-2',
                // Высота: увеличена для десктопа
                'h-12 min-h-12',
                // Граница
                'border',
                // Состояния hover/active
                isActive 
                  ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' 
                  : 'hover:brightness-110 active:scale-[0.97]',
                // Fallback стили без градиента и превью
                !hasPreview && !gradient && (isActive 
                  ? 'bg-primary text-primary-foreground border-primary/40 shadow-md' 
                  : 'bg-muted/20 border-border/40 hover:bg-muted/40'),
                // Рамка для превью/градиента
                (hasPreview || gradient) && 'border-white/20'
              )}
              style={backgroundStyle}
            >
              {/* Затемняющий слой для читаемости текста */}
              {(hasPreview || gradient) && (
                <div className="absolute inset-0 bg-black/40 rounded-[10px]" />
              )}
              {/* Текст поверх затемнения */}
              <span className={cn(
                'relative z-10 drop-shadow-sm',
                (hasPreview || gradient) && 'text-white'
              )}>
                {category.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default OverlayCategoryNav;
