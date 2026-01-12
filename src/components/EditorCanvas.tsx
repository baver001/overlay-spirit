import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useDraggable } from '@/hooks/useDraggable';
import { Overlay } from '@/lib/types';
import { APP_CONFIG, CANVAS_BLEND_MAP, BLEND_MODES } from '@/lib/constants';
import { snapToEdges, SnapResult } from '@/lib/snap';
import ImageDropzone from './ImageDropzone';
import OverlayTransformFrame from './OverlayTransformFrame';
import EditorInstructions from './EditorInstructions';
import { Button } from '@/components/ui/button';
import { Save, Share, Eye, EyeOff, Maximize2, Settings2, FlipHorizontal, FlipVertical, GripHorizontal } from 'lucide-react';
import { Trash, ImageSquare } from '@phosphor-icons/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useTranslation } from 'react-i18next';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Вычисление расстояния между двумя точками касания для pinch-zoom
const getTouchDistance = (touch1: Touch, touch2: Touch): number => {
  const dx = touch1.clientX - touch2.clientX;
  const dy = touch1.clientY - touch2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
};

// Вычисление угла между двумя точками касания
const getTouchAngle = (touch1: Touch, touch2: Touch): number => {
  const dx = touch1.clientX - touch2.clientX;
  const dy = touch1.clientY - touch2.clientY;
  return Math.atan2(dy, dx) * (180 / Math.PI);
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
  const [localAspectRatios, setLocalAspectRatios] = useState<Record<string, number>>({});
  const [canvasOffset, setCanvasOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [snapGuides, setSnapGuides] = useState<{ snappedX: SnapResult['snappedX']; snappedY: SnapResult['snappedY'] } | null>(null);
  const [isTemporarilyHidden, setIsTemporarilyHidden] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  // Toolbar drag state
  const [toolbarPos, setToolbarPos] = useState({ x: 0, y: 0 });
  const toolbarDragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);

  const handleToolbarDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    toolbarDragRef.current = {
      startX: clientX,
      startY: clientY,
      initialX: toolbarPos.x,
      initialY: toolbarPos.y,
    };
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!toolbarDragRef.current) return;
      e.preventDefault();
      
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      
      const dx = clientX - toolbarDragRef.current.startX;
      const dy = clientY - toolbarDragRef.current.startY;
      
      setToolbarPos({
        x: toolbarDragRef.current.initialX + dx,
        y: toolbarDragRef.current.initialY + dy,
      });
    };
    
    const handleEnd = () => {
      toolbarDragRef.current = null;
    };
    
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleEnd);
    
    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, []);
  const historyRef = useRef<string[]>([]);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const fittedOverlaysRef = useRef<Set<string>>(new Set());

  // Сохранение в историю перед изменениями (очень простая реализация)
  const saveToHistory = useCallback(() => {
    const currentState = JSON.stringify(overlays);
    if (historyRef.current[historyRef.current.length - 1] !== currentState) {
      historyRef.current.push(currentState);
      if (historyRef.current.length > 50) historyRef.current.shift();
    }
  }, [overlays]);

  const undo = useCallback(() => {
    if (historyRef.current.length > 0) {
      const lastState = historyRef.current.pop();
      if (lastState) {
        const parsed = JSON.parse(lastState) as Overlay[];
        // Здесь нужен способ обновить весь массив оверлеев. 
        // Поскольку props приходят сверху, нам нужно вызвать update для каждого или иметь onUpdateAll
        // Для простоты пока предположим, что мы работаем с одним (текущим)
        if (selectedOverlayId) {
          const oldOverlay = parsed.find(o => o.id === selectedOverlayId);
          if (oldOverlay) onUpdateOverlay(oldOverlay.id, oldOverlay);
        }
      }
    }
  }, [selectedOverlayId, onUpdateOverlay]);

  const handleUpdate = useCallback((id: string, newProps: Partial<Overlay>) => {
    saveToHistory();
    onUpdateOverlay(id, newProps);
  }, [onUpdateOverlay, saveToHistory]);

  const handleDelete = useCallback((id: string) => {
    saveToHistory();
    onDeleteOverlay(id);
  }, [onDeleteOverlay, saveToHistory]);

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Если нажат Space или \ — скрываем оверлеи
      if (e.key === ' ' || e.key === '\\') {
        if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setIsTemporarilyHidden(true);
        }
      }

      if (!selectedOverlayId) return;
      const overlay = overlays.find(o => o.id === selectedOverlayId);
      if (!overlay) return;

      // Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
        return;
      }

      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      const step = e.shiftKey ? 10 : 1;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          handleUpdate(overlay.id, { x: overlay.x - step });
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleUpdate(overlay.id, { x: overlay.x + step });
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleUpdate(overlay.id, { y: overlay.y - step });
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleUpdate(overlay.id, { y: overlay.y + step });
          break;
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          handleDelete(overlay.id);
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === '\\') {
        setIsTemporarilyHidden(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedOverlayId, overlays, onUpdateOverlay, onDeleteOverlay, undo]);

  // Mouse wheel handler
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!selectedOverlayId) return;
    const overlay = overlays.find(o => o.id === selectedOverlayId);
    if (!overlay) return;

    e.preventDefault();
    
    if (e.altKey) {
      // Rotation
      const delta = e.deltaY > 0 ? 5 : -5;
      let newRotation = (overlay.rotation + delta) % 360;
      if (newRotation < 0) newRotation += 360;
      handleUpdate(overlay.id, { rotation: newRotation });
    } else {
      // Scale
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      const newScale = Math.max(0.1, Math.min(5, overlay.scale + delta));
      handleUpdate(overlay.id, { scale: newScale });
    }
  }, [selectedOverlayId, overlays, handleUpdate]);
  
  // Pinch-zoom & rotation state
  const pinchRef = useRef<{
    overlayId: string;
    initialDistance: number;
    initialScale: number;
    initialAngle: number;
    initialRotation: number;
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
        const aspectRatio = im.naturalWidth / im.naturalHeight;
        setLocalAspectRatios((prev) => ({ ...prev, [o.id]: aspectRatio }));
        
        // Автоматическая подгонка для новых оверлеев на вертикальных фото
        if (imageDimensions && imageDimensions.height > imageDimensions.width && !fittedOverlaysRef.current.has(o.id)) {
          fittedOverlaysRef.current.add(o.id);
          
          const isImgVertical = true;
          const isOverlayVertical = aspectRatio < 1;
          const shouldRotate = !isOverlayVertical; // Если оверлей горизонтальный, а фото вертикальное
          const targetRotation = shouldRotate ? 90 : 0;
          
          let targetScale = 1;
          if (shouldRotate) {
            targetScale = 1 / aspectRatio;
          }
          
          onUpdateOverlay(o.id, { 
            rotation: targetRotation, 
            scale: targetScale,
            x: 0,
            y: 0
          });
        }
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
    
    // Cover логика: заполняем фото полностью
    const imageAspect = (imageStyle.width || 400) / (imageStyle.height || 400);
    const scale = overlay.scale || 1;
    
    if (aspectRatio > imageAspect) {
      // Оверлей шире - заполняем по высоте
      return {
        width: Math.round((imageStyle.height || 400) * aspectRatio) * scale,
        height: (imageStyle.height || 400) * scale,
      };
    } else {
      // Оверлей уже - заполняем по ширине
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
      handleUpdate(id, pos);
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

    handleUpdate(id, { x: snapped.x, y: snapped.y });
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
            const overlayAspect = oImg.naturalWidth / oImg.naturalHeight;
            const imageAspect = imageDimensions.width / imageDimensions.height;

            let renderWidth, renderHeight;

            // Cover логика: заполняем фото полностью без пустых краёв
            if (overlayAspect > imageAspect) {
              // Оверлей шире относительно фото - заполняем по высоте
              renderHeight = imageDimensions.height;
              renderWidth = imageDimensions.height * overlayAspect;
            } else {
              // Оверлей уже - заполняем по ширине
              renderWidth = imageDimensions.width;
              renderHeight = imageDimensions.width / overlayAspect;
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
            const overlayAspect = oImg.naturalWidth / oImg.naturalHeight;
            const imageAspect = imageDimensions.width / imageDimensions.height;

            let renderWidth, renderHeight;

            // Cover логика: заполняем фото полностью без пустых краёв
            if (overlayAspect > imageAspect) {
              // Оверлей шире относительно фото - заполняем по высоте
              renderHeight = imageDimensions.height;
              renderWidth = imageDimensions.height * overlayAspect;
            } else {
              // Оверлей уже - заполняем по ширине
              renderWidth = imageDimensions.width;
              renderHeight = imageDimensions.width / overlayAspect;
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
    
    // Cover логика: заполняем фото полностью
    const imageAspect = (imageStyle.width || 400) / (imageStyle.height || 400);
    
    if (aspectRatio > imageAspect) {
      // Оверлей шире - заполняем по высоте
      return {
        width: Math.round((imageStyle.height || 400) * aspectRatio),
        height: imageStyle.height || 400,
      };
    } else {
      // Оверлей уже - заполняем по ширине
      return {
        width: imageStyle.width || 400,
        height: Math.round((imageStyle.width || 400) / aspectRatio),
      };
    }
  }, [imageStyle, overlayAspectRatios, localAspectRatios]);

  return (
    <TooltipProvider delayDuration={0}>
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
        <div className="absolute top-4 left-0 right-0 px-4 flex justify-between z-[110] pointer-events-none">
          {/* Левая часть: Удаление изображения */}
          <div className="pointer-events-auto flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={onImageRemove}
                  variant="destructive"
                  size="sm"
                  className="shadow-lg opacity-90 hover:opacity-100 px-3 bg-red-500/80 backdrop-blur-sm hover:bg-red-600/90 border-red-400/30"
                >
                  <Trash className="w-4 h-4" weight="fill" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs px-2 py-1">
                <p>{t('editor.image_manager.delete')}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Правая часть: Hide / Save / Share */}
          <div className="pointer-events-auto flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onMouseDown={() => setIsTemporarilyHidden(true)}
                  onMouseUp={() => setIsTemporarilyHidden(false)}
                  onMouseLeave={() => setIsTemporarilyHidden(false)}
                  onTouchStart={() => setIsTemporarilyHidden(true)}
                  onTouchEnd={() => setIsTemporarilyHidden(false)}
                  variant="secondary"
                  size="sm"
                  className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 select-none"
                >
                  {isTemporarilyHidden ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                  {t('editor.hide')}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{t('editor.hide')} (Space)</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleSave}
                  variant="secondary"
                  size="sm"
                  className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {t('editor.save')}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{t('editor.save')}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleShare}
                  variant="secondary"
                  size="sm"
                  className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
                >
                  <Share className="w-4 h-4 mr-2" />
                  {t('editor.share')}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{t('editor.share')}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      )}

      <div 
        className="absolute inset-0 flex items-center justify-center p-4 md:p-8 pb-20 md:pb-8"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onClick={(e) => {
          // Клик по фону или по самому изображению (не оверлею) — снимаем выделение
          onSelectOverlay(null);
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

              {/* Оверлеи */}
            {Array.isArray(overlays) && overlays.length > 0 && !isTemporarilyHidden && overlays.map((overlay) => {
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
                  // Cover логика: заполняем фото полностью без пустых краёв
                  const imageAspect = imageStyle.width / imageStyle.height;
                  if (aspectRatio > imageAspect) {
                    // Оверлей шире относительно фото - заполняем по высоте
                    sizeStyle = {
                      height: `${imageStyle.height}px`,
                      width: `${Math.round(imageStyle.height * aspectRatio)}px`,
                    };
                  } else {
                    // Оверлей уже - заполняем по ширине
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
                      
                      // Pinch-zoom & rotation: 2 касания
                      if (e.touches.length === 2) {
                        e.preventDefault();
                        const touch1 = e.touches[0];
                        const touch2 = e.touches[1];
                        const distance = getTouchDistance(touch1, touch2);
                        const angle = getTouchAngle(touch1, touch2);
                        
                        pinchRef.current = {
                          overlayId: overlay.id,
                          initialDistance: distance,
                          initialScale: overlay.scale,
                          initialAngle: angle,
                          initialRotation: overlay.rotation,
                        };
                      } else if (e.touches.length === 1) {
                        // Обычный drag: 1 касание
                        handleTouchStart(e, overlay.id, overlay.x, overlay.y);
                      }
                    }}
                    onTouchMove={(e) => {
                      // Pinch-zoom & rotation: обработка движения двумя пальцами
                      if (e.touches.length === 2 && pinchRef.current && pinchRef.current.overlayId === overlay.id) {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        const touch1 = e.touches[0];
                        const touch2 = e.touches[1];
                        const currentDistance = getTouchDistance(touch1, touch2);
                        const currentAngle = getTouchAngle(touch1, touch2);
                        
                        const { initialDistance, initialScale, initialAngle, initialRotation } = pinchRef.current;
                        
                        // Scale
                        const scaleFactor = currentDistance / initialDistance;
                        let newScale = initialScale * scaleFactor;
                        newScale = Math.max(0.1, Math.min(5, newScale));
                        
                        // Rotation
                        const angleDiff = currentAngle - initialAngle;
                        let newRotation = (initialRotation + angleDiff) % 360;
                        if (newRotation < 0) newRotation += 360;
                        
                        handleUpdate(overlay.id, { 
                          scale: newScale,
                          rotation: newRotation 
                        });
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
                         // Заполняем фото полностью (cover), чтобы не было пустых краёв
                         backgroundSize: 'cover',
                         backgroundPosition: 'center',
                         backgroundRepeat: 'no-repeat',
                         opacity: overlay.opacity,
                      }}
                    />
                  </div>
                );
              })}
              
              {/* Snap guides */}
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

      {/* Рамка трансформации для выбранного оверлея — рендерится поверх всего */}
      {/* Показываем только когда оверлей загружен (для image — есть aspectRatio, для css — сразу) */}
      {selectedOverlay && image && canvasOffset.x !== 0 && !isTemporarilyHidden && (
        selectedOverlay.type === 'css' || 
        overlayAspectRatios?.[selectedOverlay.id] !== undefined || 
        localAspectRatios[selectedOverlay.id] !== undefined
      ) && (
        <OverlayTransformFrame
          overlay={selectedOverlay}
          width={getOverlayFrameDimensions(selectedOverlay).width}
          height={getOverlayFrameDimensions(selectedOverlay).height}
          canvasOffset={canvasOffset}
          imageDimensions={imageDimensions}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onDeselect={() => onSelectOverlay(null)}
        />
      )}
      {/* Floating Toolbar and Settings */}
      {selectedOverlay && !isTemporarilyHidden && (
        <div 
          className="absolute z-[110] flex flex-col items-center gap-4 w-full max-w-[320px] pointer-events-none touch-none"
          style={{ 
            bottom: '2rem', 
            left: '50%', 
            transform: `translate(calc(-50% + ${toolbarPos.x}px), ${toolbarPos.y}px)` 
          }}
        >
          {/* Settings Panel */}
          {showSettings && (
            <div className="pointer-events-auto bg-slate-900/60 backdrop-blur-xl rounded-2xl p-4 shadow-2xl mb-2 w-full animate-in fade-in slide-in-from-bottom-4 ring-1 ring-white/10">
               {/* Blend Mode */}
                <div className="flex items-center gap-3 mb-4">
                  <Select
                    value={selectedOverlay.blendMode}
                    onValueChange={(value: any) => handleUpdate(selectedOverlay.id, { blendMode: value })}
                  >
                    <SelectTrigger className="h-9 bg-white/5 border-white/10 text-white rounded-lg flex-1">
                      <SelectValue placeholder="Blend mode" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700 text-white max-h-60">
                      {BLEND_MODES.map((mode) => (
                        <SelectItem key={mode.value} value={mode.value} className="focus:bg-blue-500 focus:text-white">
                          {t(`blend_modes.${mode.value}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Opacity */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 px-1">
                    <Slider
                      value={[selectedOverlay.opacity]}
                      onValueChange={([value]) => handleUpdate(selectedOverlay.id, { opacity: value })}
                      min={0}
                      max={1}
                      step={0.01}
                      className="cursor-pointer"
                    />
                  </div>
                  <span className="text-xs font-mono text-slate-400 w-9 text-right">
                    {Math.round(selectedOverlay.opacity * 100)}%
                  </span>
                </div>
            </div>
          )}

          {/* Controls Bar */}
          <div className="pointer-events-auto flex flex-col items-center bg-slate-900/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/10 overflow-hidden w-full">
            {/* Drag Handle */}
            <div 
              className="w-full h-6 flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-white/5 transition-colors border-b border-white/5"
              onMouseDown={handleToolbarDragStart}
              onTouchStart={handleToolbarDragStart}
            >
              <GripHorizontal className="w-8 h-4 text-white/30" />
            </div>

            <div className="flex flex-wrap justify-center gap-1 w-full p-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => setShowSettings(!showSettings)}
                    variant={showSettings ? "default" : "ghost"}
                    size="icon"
                    className={showSettings ? "bg-blue-500 text-white hover:bg-blue-600 h-9 w-9" : "text-white hover:bg-white/10 h-9 w-9"}
                  >
                    <Settings2 className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>{t('editor.settings')}</p>
                </TooltipContent>
              </Tooltip>
              
              <div className="w-px h-8 bg-white/10 mx-1 self-center" />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => handleUpdate(selectedOverlay.id, { flipH: !selectedOverlay.flipH })}
                    variant="ghost"
                    size="icon"
                    className={`hover:bg-white/10 h-9 w-9 ${selectedOverlay.flipH ? 'bg-white/20 text-blue-300' : 'text-white'}`}
                  >
                    <FlipHorizontal className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>{t('editor.flip_h')}</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => handleUpdate(selectedOverlay.id, { flipV: !selectedOverlay.flipV })}
                    variant="ghost"
                    size="icon"
                    className={`hover:bg-white/10 h-9 w-9 ${selectedOverlay.flipV ? 'bg-white/20 text-blue-300' : 'text-white'}`}
                  >
                    <FlipVertical className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>{t('editor.flip_v')}</p>
                </TooltipContent>
              </Tooltip>

              <div className="w-px h-8 bg-white/10 mx-1 self-center" />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => {
                        const isImgVertical = imageDimensions && imageDimensions.height > imageDimensions.width;
                        const aspectRatio = overlayAspectRatios?.[selectedOverlay.id] ?? localAspectRatios[selectedOverlay.id] ?? 1;
                        const isOverlayVertical = aspectRatio < 1;
                        
                        const shouldRotate = (isImgVertical && !isOverlayVertical) || (!isImgVertical && isOverlayVertical);
                        const targetRotation = shouldRotate ? 90 : 0;
                        
                        let targetScale = 1;
                        if (shouldRotate) {
                          targetScale = isImgVertical ? (1 / aspectRatio) : aspectRatio;
                        }
                        
                        handleUpdate(selectedOverlay.id, { 
                          rotation: targetRotation, 
                          scale: targetScale, 
                          x: 0, 
                          y: 0 
                        });
                    }}
                    variant="ghost"
                    size="icon"
                    className="text-emerald-400 hover:bg-emerald-500/20 h-9 w-9"
                  >
                    <Maximize2 className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Fit to canvas</p>
                </TooltipContent>
              </Tooltip>

              <div className="w-px h-8 bg-white/10 mx-1 self-center" />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => handleDelete(selectedOverlay.id)}
                    variant="ghost"
                    size="icon"
                    className="text-red-400 hover:bg-red-500/20 h-9 w-9"
                  >
                    <Trash className="w-5 h-5" weight="fill" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>{t('editor.remove')}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      )}
    </main>
    </TooltipProvider>
  );
};

export default EditorCanvas;
