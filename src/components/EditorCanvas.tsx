import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useDraggable } from '@/hooks/useDraggable';
import { Overlay } from '@/lib/types';
import { APP_CONFIG, CANVAS_BLEND_MAP } from '@/lib/constants';
import ImageDropzone from './ImageDropzone';
import ImageManager from './ImageManager';
import OverlaySettingsModal from './OverlaySettingsModal';
import { Button } from '@/components/ui/button';
import { PanelLeftOpen, Save, Share } from 'lucide-react';
import { mockApi } from '@/lib/mockApi';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/components/ui/use-toast';
import { compressToEncodedURIComponent } from 'lz-string';

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
  onOpenSidebar?: () => void;
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
  onOpenSidebar,
}) => {
  const [settingsOverlayId, setSettingsOverlayId] = useState<string | null>(null);
  const [localAspectRatios, setLocalAspectRatios] = useState<Record<string, number>>({});
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const [workspaceSize, setWorkspaceSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const { user } = useAuth();
  const { toast } = useToast();

  // Подгружаем естественные пропорции изображений-оверлеев для DOM-рендера,
  // если они не переданы извне
  useEffect(() => {
    overlays.forEach((o) => {
      if (o.type !== 'image') return;
      const already = (overlayAspectRatios && overlayAspectRatios[o.id] !== undefined) || localAspectRatios[o.id] !== undefined;
      if (already) return;
      const im = new Image();
      im.crossOrigin = 'anonymous';
      im.onload = () => {
        setLocalAspectRatios((prev) => ({ ...prev, [o.id]: im.naturalWidth / im.naturalHeight }));
      };
      im.src = o.value;
    });
  }, [overlays, overlayAspectRatios, localAspectRatios]);

  useEffect(() => {
    const element = workspaceRef.current;
    if (!element) return;

    const updateSize = () => {
      const rect = element.getBoundingClientRect();
      setWorkspaceSize({ width: rect.width, height: rect.height });
    };

    updateSize();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;
        const { width, height } = entry.contentRect;
        setWorkspaceSize({ width, height });
      });
      observer.observe(element);
      return () => observer.disconnect();
    }

    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const canvasSize = useMemo(() => {
    if (!imageDimensions || workspaceSize.width === 0 || workspaceSize.height === 0) {
      return { width: 0, height: 0 };
    }

    const availableWidth = workspaceSize.width * APP_CONFIG.CANVAS_PADDING;
    const availableHeight = workspaceSize.height * APP_CONFIG.CANVAS_PADDING;
    const aspectRatio = imageDimensions.width / imageDimensions.height;

    let width = availableWidth;
    let height = availableHeight;

    if (aspectRatio > availableWidth / availableHeight) {
      width = Math.min(availableWidth, imageDimensions.width);
      height = width / aspectRatio;
    } else {
      height = Math.min(availableHeight, imageDimensions.height);
      width = height * aspectRatio;
    }

    return { width, height };
  }, [imageDimensions, workspaceSize]);

  // Свободное движение оверлеев - маскирование происходит через overflow: hidden родительского контейнера
  const { handleMouseDown, handleMouseMove, handleMouseUp, isDragging } = useDraggable((id, pos) => {
    if (!id) return;
    onUpdateOverlay(id, pos);
  });

  const renderMergedImage = useCallback(async (): Promise<string> => {
    if (!image || !imageDimensions) {
      throw new Error('Нет изображения для рендера');
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Не удалось получить контекст canvas');
    }

    canvas.width = imageDimensions.width;
    canvas.height = imageDimensions.height;

    const loadImage = (src: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const im = new Image();
        im.crossOrigin = 'anonymous';
        im.onload = () => resolve(im);
        im.onerror = () => reject(new Error(`Не удалось загрузить изображение: ${src}`));
        im.src = src;
      });

    const baseImg = await loadImage(image);
    const overlayImageMap = new Map<string, HTMLImageElement>();

    const imageOverlays = overlays.filter((o) => o.type === 'image');
    if (imageOverlays.length > 0) {
      const loadedOverlays = await Promise.allSettled(
        imageOverlays.map(async (o) => {
          const loaded = await loadImage(o.value);
          return { id: o.id, image: loaded };
        })
      );

      loadedOverlays.forEach((result) => {
        if (result.status === 'fulfilled') {
          overlayImageMap.set(result.value.id, result.value.image);
        }
      });
    }

    ctx.drawImage(baseImg, 0, 0, imageDimensions.width, imageDimensions.height);

    overlays.forEach((overlay) => {
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

          let renderWidth: number;
          let renderHeight: number;

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

    return canvas.toDataURL('image/png', 1.0);
  }, [image, imageDimensions, overlays]);

  const handleSave = useCallback(async () => {
    if (!image || !imageDimensions) return;
    try {
      const dataUrl = await renderMergedImage();
      const link = document.createElement('a');
      link.download = `edited-image-${Date.now()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: 'Изображение сохранено', description: 'Файл загружен в формате PNG.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Произошла ошибка';
      toast({ title: 'Не удалось сохранить изображение', description: message, variant: 'destructive' });
    }
  }, [image, imageDimensions, renderMergedImage, toast]);

  const handleShare = useCallback(async () => {
    if (!image || !imageDimensions) return;
    try {
      const dataUrl = await renderMergedImage();
      const { id } = await mockApi.createShare({ imageData: dataUrl, userId: user?.id });
      const compressedData = compressToEncodedURIComponent(dataUrl);
      const shareUrl = `${window.location.origin}/share/${id}${compressedData ? `?data=${compressedData}` : ''}`;

      if (navigator.share) {
        await navigator.share({
          title: 'Мой результат в Loverlay',
          text: 'Посмотрите, что получилось!',
          url: shareUrl,
        });
        toast({ title: 'Ссылка отправлена', description: 'Поделитесь результатом с друзьями.' });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast({ title: 'Ссылка скопирована', description: shareUrl });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Попробуйте ещё раз позже';
      toast({ title: 'Не удалось поделиться', description: message, variant: 'destructive' });
    }
  }, [image, imageDimensions, renderMergedImage, toast, user]);

  const settingsOverlay = overlays.find(o => o.id === settingsOverlayId);

  return (
    <main className="flex h-full w-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2 md:px-6">
        <div className="flex items-center gap-2 md:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenSidebar?.()}
            className="shrink-0"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </Button>
          <span className="text-xs font-medium text-muted-foreground">
            {overlays.length > 0 ? `${overlays.length} оверлеев` : 'Библиотека оверлеев'}
          </span>
        </div>
        {image && (
          <div className="ml-auto flex items-center gap-2">
            <Button
              onClick={handleSave}
              variant="secondary"
              size="sm"
              className="bg-white/10 text-white hover:bg-white/20"
            >
              <Save className="mr-2 h-4 w-4" />
              Сохранить
            </Button>
            <Button
              onClick={handleShare}
              variant="secondary"
              size="sm"
              className="bg-white/10 text-white hover:bg-white/20"
            >
              <Share className="mr-2 h-4 w-4" />
              Поделиться
            </Button>
          </div>
        )}
      </div>

      <div
        ref={workspaceRef}
        className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4 pb-6 pt-4 sm:px-8 md:px-12"
        style={{
          background: 'hsl(215 27.9% 12%)',
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)',
          backgroundSize: '20px 20px',
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onSelectOverlay(null);
          }
        }}
      >
        {!image ? (
          <div className="w-full max-w-3xl">
            <ImageDropzone onImageSelect={onImageSelect} />
          </div>
        ) : (
          <div className="relative flex max-h-full max-w-full items-center justify-center">
            <div
              className="relative isolate overflow-hidden rounded-xl border border-white/10 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.65)]"
              style={{
                width: canvasSize.width ? `${canvasSize.width}px` : undefined,
                height: canvasSize.height ? `${canvasSize.height}px` : undefined,
              }}
            >
              <img
                src={image}
                alt="Editor canvas"
                className="h-full w-full rounded-xl object-contain"
              />

              {Array.isArray(overlays) && overlays.length > 0 &&
                overlays.map((overlay) => {
                  const aspectRatio = overlayAspectRatios?.[overlay.id] ?? localAspectRatios[overlay.id];
                  let sizeStyle: React.CSSProperties = {};
                  const width = canvasSize.width;
                  const height = canvasSize.height;

                  if (overlay.type === 'css' || !aspectRatio || !width || !height) {
                    const largerDimension = Math.max(width || 0, height || 0) || 1;
                    sizeStyle = {
                      width: `${largerDimension}px`,
                      height: `${largerDimension}px`,
                    };
                  } else {
                    const imageIsVertical = (height ?? 0) > (width ?? 0);
                    if (imageIsVertical) {
                      sizeStyle = {
                        height: `${height}px`,
                        width: `${Math.round(height * aspectRatio)}px`,
                      };
                    } else {
                      sizeStyle = {
                        width: `${width}px`,
                        height: `${Math.round(width / aspectRatio)}px`,
                      };
                    }
                  }

                  return (
                    <div
                      key={overlay.id}
                      className={`absolute pointer-events-auto ${isDragging ? 'cursor-grabbing' : 'cursor-move'}`}
                      style={{
                        left: '50%',
                        top: '50%',
                        ...sizeStyle,
                        transform: `translate(-50%, -50%) translate(${overlay.x}px, ${overlay.y}px)`,
                        zIndex: 10,
                        mixBlendMode: overlay.blendMode,
                      }}
                      onMouseDown={(event) => {
                        event.stopPropagation();
                        handleMouseDown(event, overlay.id, overlay.x, overlay.y);
                        onSelectOverlay(overlay.id);
                      }}
                      onClick={(event) => {
                        event.stopPropagation();
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
                          backgroundImage: overlay.type === 'image' ? `url(${overlay.value})` : undefined,
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
