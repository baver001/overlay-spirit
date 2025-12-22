import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useDraggable } from '@/hooks/useDraggable';
import { Overlay } from '@/lib/types';
import { APP_CONFIG, CANVAS_BLEND_MAP } from '@/lib/constants';
import { snapToEdges, SnapResult } from '@/lib/snap';
import ImageDropzone from './ImageDropzone';
import ImageManager from './ImageManager';
import OverlaySettingsModal from './OverlaySettingsModal';
import OverlayTransformFrame from './OverlayTransformFrame';
import EditorInstructions from './EditorInstructions';
import { Button } from '@/components/ui/button';
import { Save, Share } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Вычисление расстояния между двумя точками касания для pinch-zoom
const getTouchDistance = (touch1: Touch, touch2: Touch): number => {
  const dx = touch1.clientX - touch2.clientX;
  const dy = touch1.clientY - touch2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
};

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
  const { t } = useTranslation();
  const [settingsOverlayId, setSettingsOverlayId] = useState<string | null>(null);
  const [localAspectRatios, setLocalAspectRatios] = useState<Record<string, number>>({});
  const [canvasOffset, setCanvasOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [snapGuides, setSnapGuides] = useState<{ snappedX: SnapResult['snappedX']; snappedY: SnapResult['snappedY'] } | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  
  // Pinch-zoom state
  const pinchRef = useRef<{
    overlayId: string;
    initialDistance: number;
    initialScale: number;
  } | null>(null);

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

    // На мобильных сайдбар скрыт, не вычитаем его ширину
    const isMobile = window.innerWidth < 768;
    const containerWidth = window.innerWidth - (isMobile ? 0 : APP_CONFIG.SIDEBAR_WIDTH);
    const containerHeight = window.innerHeight - APP_CONFIG.HEADER_HEIGHT - (isMobile ? 64 : 0); // 64px - высота нижней панели на мобильных
    const aspectRatio = imageDimensions.width / imageDimensions.height;

    let width, height;

    // Убрали Math.min с оригинальными размерами — теперь маленькие изображения
    // будут масштабироваться вверх, как и большие масштабируются вниз
    if (aspectRatio > containerWidth / containerHeight) {
      width = containerWidth * APP_CONFIG.CANVAS_PADDING;
      height = width / aspectRatio;
    } else {
      height = containerHeight * APP_CONFIG.CANVAS_PADDING;
      width = height * aspectRatio;
    }

    return { width, height };
  }, [imageDimensions]);

  // Вычисляем размеры оверлея (перенесено выше для использования в snap)
  const getOverlayDimensions = useCallback((overlay: Overlay) => {
    const aspectRatio = overlayAspectRatios?.[overlay.id] ?? localAspectRatios[overlay.id];
    
    if (overlay.type === 'css' || !aspectRatio || !imageStyle.width || !imageStyle.height) {
      const size = Math.max(imageStyle.width || 400, imageStyle.height || 400);
      return { width: size * (overlay.scale || 1), height: size * (overlay.scale || 1) };
    }
    
    const imageIsVertical = (imageStyle.height || 0) > (imageStyle.width || 0);
    const scale = overlay.scale || 1;
    if (imageIsVertical) {
      return {
        width: Math.round((imageStyle.height || 400) * aspectRatio) * scale,
        height: (imageStyle.height || 400) * scale,
      };
    } else {
      return {
        width: (imageStyle.width || 400) * scale,
        height: Math.round((imageStyle.width || 400) / aspectRatio) * scale,
      };
    }
  }, [imageStyle, overlayAspectRatios, localAspectRatios]);

  // Свободное движение оверлеев с прилипанием к краям
  const { handleMouseDown, handleTouchStart, handleMouseMove, handleMouseUp, isDragging } = useDraggable((id, pos) => {
    if (!id) return;
    
    const overlay = overlays.find(o => o.id === id);
    if (!overlay || !imageStyle.width || !imageStyle.height) {
      onUpdateOverlay(id, pos);
      return;
    }

    const dimensions = getOverlayDimensions(overlay);
    const snapped = snapToEdges(
      pos,
      dimensions.width,
      dimensions.height,
      imageStyle.width,
      imageStyle.height,
      12 // threshold в пикселях
    );

    // Показываем направляющие при snap
    if (snapped.snappedX || snapped.snappedY) {
      setSnapGuides({ snappedX: snapped.snappedX, snappedY: snapped.snappedY });
    } else {
      setSnapGuides(null);
    }

    onUpdateOverlay(id, { x: snapped.x, y: snapped.y });
  });

  // Скрываем направляющие когда drag закончен
  useEffect(() => {
    if (!isDragging) {
      setSnapGuides(null);
    }
  }, [isDragging]);

  const handleSave = useCallback(async () => {
    if (!image || !imageDimensions) return;
    
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error(t('editor.canvas_context_error'));
        return;
      }

      canvas.width = imageDimensions.width;
      canvas.height = imageDimensions.height;

      const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
        const im = new Image();
        im.crossOrigin = 'anonymous';
        im.onload = () => resolve(im);
        im.onerror = () => reject(new Error(`${t('editor.image_load_error')}: ${src}`));
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
      console.error(t('editor.save_error') + ':', error);
    }
  }, [image, imageDimensions, overlays, t]);

  const handleShare = useCallback(async () => {
    if (!image || !imageDimensions) return;
    
    try {
      // Генерируем изображение (аналогично handleSave)
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error(t('editor.canvas_context_error'));
        return;
      }

      canvas.width = imageDimensions.width;
      canvas.height = imageDimensions.height;

      const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
        const im = new Image();
        im.crossOrigin = 'anonymous';
        im.onload = () => resolve(im);
        im.onerror = () => reject(new Error(`${t('editor.image_load_error')}: ${src}`));
        im.src = src;
      });

      // Загружаем оригинал и все изображения-оверлеи
      const baseImg = await loadImage(image);
      const overlayImageMap = new Map<string, HTMLImageElement>();
      
      const imageOverlays = overlays.filter((o) => o.type === 'image');
      if (imageOverlays.length > 0) {
        const loadedOverlays = await Promise.allSettled(
          imageOverlays.map(async (o) => {
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

      // Рисуем фото
      ctx.drawImage(baseImg, 0, 0, imageDimensions.width, imageDimensions.height);

      // Рисуем оверлеи
      Array.isArray(overlays) && overlays.forEach((overlay) => {
        ctx.save();
        
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
              renderHeight = imageDimensions.height;
              renderWidth = imageDimensions.height * aspectRatio;
            } else {
              renderWidth = imageDimensions.width;
              renderHeight = imageDimensions.width / aspectRatio;
            }
            ctx.drawImage(oImg, -renderWidth / 2, -renderHeight / 2, renderWidth, renderHeight);
          }
        }
        ctx.restore();
      });

      // Конвертируем canvas в blob
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/png', 1.0);
      });

      if (!blob) {
        console.error('Failed to create image blob');
        return;
      }

      const file = new File([blob], `overlay-spirit-${Date.now()}.png`, { type: 'image/png' });

      // Проверяем поддержку Web Share API с файлами
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: t('editor.share_title'),
          text: t('editor.share_text'),
        });
      } else if (navigator.share) {
        // Fallback: share без файла (на некоторых устройствах)
        // Скачиваем изображение вместо этого
        const link = document.createElement('a');
        link.download = file.name;
        link.href = URL.createObjectURL(blob);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
      } else {
        // Полный fallback - просто скачиваем
        const link = document.createElement('a');
        link.download = file.name;
        link.href = URL.createObjectURL(blob);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
      }
    } catch (error) {
      console.error(t('editor.share_error') + ':', error);
    }
  }, [image, imageDimensions, overlays, t]);

  const settingsOverlay = overlays.find(o => o.id === settingsOverlayId);
  const selectedOverlay = overlays.find(o => o.id === selectedOverlayId);

  // Отслеживаем позицию canvas для рамки трансформации
  useEffect(() => {
    const updateCanvasOffset = () => {
      if (canvasContainerRef.current) {
        const rect = canvasContainerRef.current.getBoundingClientRect();
        setCanvasOffset({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        });
      }
    };

    updateCanvasOffset();
    window.addEventListener('resize', updateCanvasOffset);
    window.addEventListener('scroll', updateCanvasOffset);
    
    return () => {
      window.removeEventListener('resize', updateCanvasOffset);
      window.removeEventListener('scroll', updateCanvasOffset);
    };
  }, [image, imageDimensions]);

  // Вычисляем размеры для рамки трансформации (без scale)
  const getOverlayFrameDimensions = useCallback((overlay: Overlay) => {
    const aspectRatio = overlayAspectRatios?.[overlay.id] ?? localAspectRatios[overlay.id];
    
    if (overlay.type === 'css' || !aspectRatio || !imageStyle.width || !imageStyle.height) {
      const size = Math.max(imageStyle.width || 400, imageStyle.height || 400);
      return { width: size, height: size };
    }
    
    const imageIsVertical = (imageStyle.height || 0) > (imageStyle.width || 0);
    if (imageIsVertical) {
      return {
        width: Math.round((imageStyle.height || 400) * aspectRatio),
        height: imageStyle.height || 400,
      };
    } else {
      return {
        width: imageStyle.width || 400,
        height: Math.round((imageStyle.width || 400) / aspectRatio),
      };
    }
  }, [imageStyle, overlayAspectRatios, localAspectRatios]);

  return (
    <main className="fixed top-16 left-0 md:left-[340px] right-0 bottom-0 md:bottom-0 pb-16 md:pb-0 overflow-hidden" 
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
            {t('editor.save')}
          </Button>
          <Button
            onClick={handleShare}
            variant="secondary"
            size="sm"
            className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
          >
            <Share className="w-4 h-4 mr-2" />
            {t('editor.share')}
          </Button>
        </div>
      )}

      <div 
        className="absolute inset-0 flex items-center justify-center p-4 md:p-8 pb-20 md:pb-8"
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
          // Показываем дропзону для загрузки изображения
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
              ref={canvasContainerRef}
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
                    // Предотвращаем стандартное поведение touch (скролл и т.д.)
                    touchAction: 'none',
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      handleMouseDown(e, overlay.id, overlay.x, overlay.y);
                      onSelectOverlay(overlay.id);
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      onSelectOverlay(overlay.id);
                      
                      // Pinch-zoom: 2 касания
                      if (e.touches.length === 2) {
                        e.preventDefault();
                        const touch1 = e.touches[0];
                        const touch2 = e.touches[1];
                        const distance = getTouchDistance(touch1, touch2);
                        
                        pinchRef.current = {
                          overlayId: overlay.id,
                          initialDistance: distance,
                          initialScale: overlay.scale,
                        };
                      } else if (e.touches.length === 1) {
                        // Обычный drag: 1 касание
                        handleTouchStart(e, overlay.id, overlay.x, overlay.y);
                      }
                    }}
                    onTouchMove={(e) => {
                      // Pinch-zoom: обработка движения двумя пальцами
                      if (e.touches.length === 2 && pinchRef.current && pinchRef.current.overlayId === overlay.id) {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        const touch1 = e.touches[0];
                        const touch2 = e.touches[1];
                        const currentDistance = getTouchDistance(touch1, touch2);
                        
                        const { initialDistance, initialScale } = pinchRef.current;
                        const scaleFactor = currentDistance / initialDistance;
                        let newScale = initialScale * scaleFactor;
                        
                        // Ограничиваем масштаб
                        newScale = Math.max(0.1, Math.min(5, newScale));
                        
                        onUpdateOverlay(overlay.id, { scale: newScale });
                      }
                    }}
                    onTouchEnd={(e) => {
                      // Сброс pinch если пальцев меньше 2
                      if (e.touches.length < 2 && pinchRef.current?.overlayId === overlay.id) {
                        pinchRef.current = null;
                      }
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

              {/* Snap guides — направляющие для прилипания */}
              {snapGuides && isDragging && (
                <>
                  {/* Вертикальная центральная линия */}
                  {snapGuides.snappedX === 'center' && (
                    <div
                      className="absolute top-0 bottom-0 w-px bg-cyan-400 pointer-events-none z-50"
                      style={{ left: '50%', transform: 'translateX(-50%)' }}
                    />
                  )}
                  {/* Левая граница */}
                  {snapGuides.snappedX === 'left' && (
                    <div
                      className="absolute top-0 bottom-0 w-px bg-cyan-400 pointer-events-none z-50"
                      style={{ left: 0 }}
                    />
                  )}
                  {/* Правая граница */}
                  {snapGuides.snappedX === 'right' && (
                    <div
                      className="absolute top-0 bottom-0 w-px bg-cyan-400 pointer-events-none z-50"
                      style={{ right: 0 }}
                    />
                  )}
                  {/* Горизонтальная центральная линия */}
                  {snapGuides.snappedY === 'center' && (
                    <div
                      className="absolute left-0 right-0 h-px bg-cyan-400 pointer-events-none z-50"
                      style={{ top: '50%', transform: 'translateY(-50%)' }}
                    />
                  )}
                  {/* Верхняя граница */}
                  {snapGuides.snappedY === 'top' && (
                    <div
                      className="absolute left-0 right-0 h-px bg-cyan-400 pointer-events-none z-50"
                      style={{ top: 0 }}
                    />
                  )}
                  {/* Нижняя граница */}
                  {snapGuides.snappedY === 'bottom' && (
                    <div
                      className="absolute left-0 right-0 h-px bg-cyan-400 pointer-events-none z-50"
                      style={{ bottom: 0 }}
                    />
                  )}
                </>
              )}
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

      {/* Рамка трансформации для выбранного оверлея — рендерится поверх всего */}
      {/* Показываем только когда оверлей загружен (для image — есть aspectRatio, для css — сразу) */}
      {selectedOverlay && image && canvasOffset.x !== 0 && (
        selectedOverlay.type === 'css' || 
        overlayAspectRatios?.[selectedOverlay.id] !== undefined || 
        localAspectRatios[selectedOverlay.id] !== undefined
      ) && (
        <OverlayTransformFrame
          overlay={selectedOverlay}
          width={getOverlayFrameDimensions(selectedOverlay).width}
          height={getOverlayFrameDimensions(selectedOverlay).height}
          canvasOffset={canvasOffset}
          onUpdate={onUpdateOverlay}
          onDelete={onDeleteOverlay}
        />
      )}
    </main>
  );
};

export default EditorCanvas;
