import React, { useState, useCallback, useMemo } from 'react';
import { useDraggable } from '@/hooks/useDraggable';
import { Overlay } from '@/lib/types';
import { APP_CONFIG, CANVAS_BLEND_MAP } from '@/lib/constants';
import ImageDropzone from './ImageDropzone';
import ImageManager from './ImageManager';
import OverlaySettingsModal from './OverlaySettingsModal';
import { Button } from '@/components/ui/button';
import { Save, Share } from 'lucide-react';

interface EditorCanvasProps {
  image: string | null;
  imageDimensions: { width: number; height: number } | null;
  overlays: Overlay[];
  onUpdateOverlay: (id: string, newProps: Partial<Overlay>) => void;
  selectedOverlayId: string | null;
  onSelectOverlay: (id: string | null) => void;
  onDeleteOverlay: (id: string) => void;
  onImageSelect: (file: File) => void;
  onImageRemove: () => void;
  // Может не быть, если вызывается из старого рендера/страницы
  overlayAspectRatios?: Record<string, number>;
}

const EditorCanvas: React.FC<EditorCanvasProps> = ({
  image,
  imageDimensions,
  overlays,
  onUpdateOverlay,
  selectedOverlayId,
  onSelectOverlay,
  onDeleteOverlay,
  onImageSelect,
  onImageRemove,
  overlayAspectRatios,
}) => {
  const [settingsOverlayId, setSettingsOverlayId] = useState<string | null>(null);
  const [localAspectRatios, setLocalAspectRatios] = useState<Record<string, number>>({});

  // Подгружаем естественные пропорции изображений-оверлеев для DOM-рендера,
  // если они не переданы извне
  React.useEffect(() => {
    overlays.forEach((o) => {
      if (o.type !== 'image') return;
      const already = (overlayAspectRatios && overlayAspectRatios[o.id] !== undefined) || localAspectRatios[o.id] !== undefined;
      if (already) return;
      const im = new Image();
      im.crossOrigin = 'anonymous';
      im.onload = () => {
        setLocalAspectRatios((prev) => ({ ...prev, [o.id]: im.naturalWidth / im.naturalHeight }));
      };
      // Преобразуем ключ из БД в полный URL, если нужно
      let imageUrl = o.value;
      if (imageUrl.startsWith('overlays/') && !imageUrl.startsWith('/api/files/')) {
        imageUrl = `/api/files/${imageUrl}`;
      }
      im.src = imageUrl;
    });
  }, [overlays, overlayAspectRatios, localAspectRatios]);
  
  const imageStyle = useMemo(() => {
    if (!imageDimensions) return {};

    const containerWidth = window.innerWidth - APP_CONFIG.SIDEBAR_WIDTH;
    const containerHeight = window.innerHeight - APP_CONFIG.HEADER_HEIGHT;
    const aspectRatio = imageDimensions.width / imageDimensions.height;

    let width, height;

    if (aspectRatio > containerWidth / containerHeight) {
      width = Math.min(containerWidth * APP_CONFIG.CANVAS_PADDING, imageDimensions.width);
      height = width / aspectRatio;
    } else {
      height = Math.min(containerHeight * APP_CONFIG.CANVAS_PADDING, imageDimensions.height);
      width = height * aspectRatio;
    }

    return { width, height };
  }, [imageDimensions]);

  // Свободное движение оверлеев - маскирование происходит через overflow: hidden родительского контейнера
  const { handleMouseDown, handleMouseMove, handleMouseUp, isDragging } = useDraggable((id, pos) => {
    if (!id) return;
    onUpdateOverlay(id, pos);
  });

  const handleSave = useCallback(async () => {
    if (!image || !imageDimensions) return;
    
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('Не удалось получить контекст canvas');
        return;
      }

      canvas.width = imageDimensions.width;
      canvas.height = imageDimensions.height;

      const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
        const im = new Image();
        im.crossOrigin = 'anonymous';
        im.onload = () => resolve(im);
        im.onerror = () => reject(new Error(`Не удалось загрузить изображение: ${src}`));
        im.src = src;
      });

      // Загружаем оригинал и все изображения-оверлеи
      const baseImg = await loadImage(image);
      const overlayImageMap = new Map<string, HTMLImageElement>();
      
      const imageOverlays = overlays.filter((o) => o.type === 'image');
      if (imageOverlays.length > 0) {
        const loadedOverlays = await Promise.allSettled(
          imageOverlays.map(async (o) => {
            // Преобразуем ключ из БД в полный URL, если нужно
            let imageUrl = o.value;
            if (imageUrl.startsWith('overlays/') && !imageUrl.startsWith('/api/files/')) {
              imageUrl = `/api/files/${imageUrl}`;
            }
            const loaded = await loadImage(imageUrl);
            return { id: o.id, image: loaded };
          })
        );
        
        loadedOverlays.forEach((result) => {
          if (result.status === 'fulfilled') {
            overlayImageMap.set(result.value.id, result.value.image);
          }
        });
      }

      // Сначала рисуем фото
      ctx.drawImage(baseImg, 0, 0, imageDimensions.width, imageDimensions.height);

      // Затем оверлеи по порядку
      Array.isArray(overlays) && overlays.forEach((overlay) => {
        ctx.save();
        
        // Устанавливаем клип/маску по форме основного изображения ДО всех трансформаций оверлея
        ctx.beginPath();
        ctx.rect(0, 0, imageDimensions.width, imageDimensions.height);
        ctx.clip();

        ctx.globalAlpha = overlay.opacity;
        ctx.globalCompositeOperation = CANVAS_BLEND_MAP[overlay.blendMode] ?? 'source-over';

        const centerX = imageDimensions.width / 2 + overlay.x;
        const centerY = imageDimensions.height / 2 + overlay.y;

        ctx.translate(centerX, centerY);
        ctx.rotate((overlay.rotation * Math.PI) / 180);
        ctx.scale(overlay.scale * (overlay.flipH ? -1 : 1), overlay.scale * (overlay.flipV ? -1 : 1));

        if (overlay.type === 'css') {
          const largerDimension = Math.max(imageDimensions.width, imageDimensions.height);
          ctx.fillStyle = overlay.value;
          ctx.fillRect(-largerDimension / 2, -largerDimension / 2, largerDimension, largerDimension);
        } else {
          const oImg = overlayImageMap.get(overlay.id);
          if (oImg) {
            const aspectRatio = oImg.naturalWidth / oImg.naturalHeight;
            const imageIsVertical = imageDimensions.height > imageDimensions.width;

            let renderWidth, renderHeight;

            if (imageIsVertical) {
              // Заполнение по высоте фото, ширина по аспекту
              renderHeight = imageDimensions.height;
              renderWidth = imageDimensions.height * aspectRatio;
            } else {
              // Заполнение по ширине фото, высота по аспекту
              renderWidth = imageDimensions.width;
              renderHeight = imageDimensions.width / aspectRatio;
            }
            ctx.drawImage(oImg, -renderWidth / 2, -renderHeight / 2, renderWidth, renderHeight);
          }
        }
        ctx.restore();
      });

      // Скачиваем результат
      const link = document.createElement('a');
      link.download = `edited-image-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Ошибка при сохранении изображения:', error);
    }
  }, [image, imageDimensions, overlays]);

  const handleShare = useCallback(async () => {
    if (!image || !imageDimensions) return;
    
    try {
      if (navigator.share) {
        // Используем Web Share API если доступен
        await navigator.share({
          title: 'Отредактированное изображение',
          text: 'Посмотрите на мое отредактированное изображение!',
          url: window.location.href
        });
      } else {
        // Fallback - копируем URL в буфер обмена
        await navigator.clipboard.writeText(window.location.href);
        console.log('URL скопирован в буфер обмена');
      }
    } catch (error) {
      console.error('Ошибка при попытке поделиться:', error);
    }
  }, [image, imageDimensions]);

  const settingsOverlay = overlays.find(o => o.id === settingsOverlayId);

  return (
    <main className="fixed top-16 left-[340px] right-0 bottom-0 overflow-hidden" 
          style={{
            background: 'hsl(215 27.9% 12%)',
            backgroundImage: `
              radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)
            `,
            backgroundSize: '20px 20px'
          }}>
      
      {/* Кнопки управления */}
      {image && (
        <div className="absolute top-4 right-4 flex gap-2 z-20">
          <Button
            onClick={handleSave}
            variant="secondary"
            size="sm"
            className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
          >
            <Save className="w-4 h-4 mr-2" />
            Сохранить
          </Button>
          <Button
            onClick={handleShare}
            variant="secondary"
            size="sm"
            className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
          >
            <Share className="w-4 h-4 mr-2" />
            Поделиться
          </Button>
        </div>
      )}

      <div 
        className="absolute inset-0 flex items-center justify-center p-8"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={(e) => {
          // Клик по фону холста — закрываем редактор
          if (e.target === e.currentTarget) {
            onSelectOverlay(null);
          }
        }}
      >
        {!image ? (
          <div className="w-full h-full max-w-4xl max-h-4xl">
            <ImageDropzone onImageSelect={onImageSelect} />
          </div>
        ) : (
          // Расширенный контейнер для оверлеев, который не ограничивает их размещение
          <div 
            className="relative"
            style={{
              width: '100%',
              height: '100%',
              minWidth: '800px',
              minHeight: '600px',
            }}
          >
            {/* Контейнер изображения и оверлеев с правильным контекстом смешивания */}
            <div
              className="absolute left-1/2 top-1/2 rounded-lg shadow-[0_50px_140px_-40px_rgba(0,0,0,0.6)] border border-gray-200"
              style={{
                ...imageStyle,
                transform: 'translate(-50%, -50%)',
                isolation: 'isolate', // Для корректного mix-blend-mode
                zIndex: 1,
                overflow: 'hidden', // Маскируем все, что выходит за пределы
              }}
            >
              {/* Базовое изображение */}
              <img
                src={image}
                alt="Editor canvas"
                className="w-full h-full object-contain rounded-lg block"
              />

              {/* Оверлеи: позиционируются внутри родительского контейнера, который имеет overflow:hidden */}
            {Array.isArray(overlays) && overlays.length > 0 && overlays.map((overlay) => {
              const aspectRatio = overlayAspectRatios?.[overlay.id] ?? localAspectRatios[overlay.id];
                let sizeStyle = {};

              // Если нет данных о пропорциях, рендерим безопасный квадрат и не падаем
              if (overlay.type === 'css' || !aspectRatio || !imageStyle.width || !imageStyle.height) {
                  const largerDimension = Math.max(imageStyle.width, imageStyle.height);
                  sizeStyle = {
                    width: `${largerDimension}px`,
                    height: `${largerDimension}px`,
                  };
                } else {
                  const imageIsVertical = imageStyle.height > imageStyle.width;
                  if (imageIsVertical) {
                    sizeStyle = {
                     height: `${imageStyle.height}px`,
                     width: `${Math.round(imageStyle.height * aspectRatio)}px`,
                    };
                  } else {
                    sizeStyle = {
                    width: `${imageStyle.width}px`,
                    height: `${Math.round(imageStyle.width / aspectRatio)}px`,
                    };
                  }
                }

                return (
                  <div
                    key={overlay.id}
                    className={`absolute pointer-events-auto ${
                      isDragging ? 'cursor-grabbing' : 'cursor-move'
                    }`}
                  style={{
                      left: '50%',
                      top: '50%',
                      ...sizeStyle,
                      transform: `translate(-50%, -50%) translate(${overlay.x}px, ${overlay.y}px)`,
                      zIndex: 10,
                    // Переносим режим наложения на внешний контейнер, чтобы избежать
                    // проблем смешивания на трансформированном дочернем слое
                    mixBlendMode: overlay.blendMode,
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      handleMouseDown(e, overlay.id, overlay.x, overlay.y);
                      onSelectOverlay(overlay.id);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectOverlay(overlay.id);
                    }}
                  >
                     <div
                      className="absolute left-1/2 top-1/2"
                      style={{
                        width: '100%',
                        height: '100%',
                        transform: `translate(-50%, -50%) rotate(${overlay.rotation}deg) scale(${overlay.scale}) ${overlay.flipH ? 'scaleX(-1)' : ''} ${overlay.flipV ? 'scaleY(-1)' : ''}`,
                        transformOrigin: 'center',
                        background: overlay.type === 'css' ? overlay.value : undefined,
                        backgroundImage: overlay.type === 'image' ? (() => {
                          // Преобразуем ключ из БД в полный URL, если нужно
                          let imageUrl = overlay.value;
                          if (imageUrl.startsWith('overlays/') && !imageUrl.startsWith('/api/files/')) {
                            imageUrl = `/api/files/${imageUrl}`;
                          }
                          return `url(${imageUrl})`;
                        })() : undefined,
                         // Чтобы не искажать пропорции изображения внутри контейнера
                         backgroundSize: 'contain',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        opacity: overlay.opacity,
                      }}
                    />
                  </div>
                );
              })}
              
              <ImageManager 
                image={image}
                onImageSelect={onImageSelect}
                onImageRemove={onImageRemove}
              />
            </div>
          </div>
        )}
      </div>

      {settingsOverlay && (
        <OverlaySettingsModal
          overlay={settingsOverlay}
          isOpen={!!settingsOverlayId}
          onClose={() => setSettingsOverlayId(null)}
          onUpdate={onUpdateOverlay}
          onDelete={onDeleteOverlay}
        />
      )}
    </main>
  );
};

export default EditorCanvas;
