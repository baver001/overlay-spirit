import React, { useCallback, useRef, useState } from 'react';
import { Overlay } from '@/lib/types';
import { FlipHorizontal, FlipVertical, X, RotateCw, Maximize2, Trash2, Settings2, Droplets, Type } from 'lucide-react';
import { BLEND_MODES } from '@/lib/constants';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

interface OverlayTransformFrameProps {
  overlay: Overlay;
  width: number;
  height: number;
  canvasOffset: { x: number; y: number };
  imageDimensions?: { width: number; height: number } | null;
  onUpdate: (id: string, newProps: Partial<Overlay>) => void;
  onDelete: (id: string) => void;
  onDeselect: () => void;
}

type HandleType = 'tl' | 'tr' | 'bl' | 'br' | 'rotate';

// Размер узлов увеличен для лучшей доступности на touch-устройствах
const HANDLE_SIZE = 32; // Большая невидимая зона касания
const HANDLE_VISUAL_SIZE = 10; // Визуальный размер (для отображения)
const ROTATE_OFFSET = 40;
const BUTTON_SIZE = 36;
const BUTTON_GAP = 6;

// Вспомогательная функция поворота точки
const rotatePoint = (x: number, y: number, angleDeg: number) => {
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return {
    x: x * cos - y * sin,
    y: x * sin + y * cos,
  };
};

// Противоположные углы для масштабирования
const oppositeCorners: Record<string, string> = {
  tl: 'br',
  tr: 'bl',
  bl: 'tr',
  br: 'tl',
};

// Базовые позиции углов (относительно центра, без scale)
const cornerOffsets: Record<string, { x: number; y: number }> = {
  tl: { x: -0.5, y: -0.5 },
  tr: { x: 0.5, y: -0.5 },
  bl: { x: -0.5, y: 0.5 },
  br: { x: 0.5, y: 0.5 },
};

const OverlayTransformFrame: React.FC<OverlayTransformFrameProps> = ({
  overlay,
  width,
  height,
  canvasOffset,
  imageDimensions,
  onUpdate,
  onDelete,
  onDeselect,
}) => {
  const { t } = useTranslation();
  const [showSettings, setShowSettings] = useState(false);
  const startRef = useRef<{ 
    x: number; 
    y: number; 
    scale: number; 
    rotation: number;
    overlayX: number;
    overlayY: number;
    anchorWorldX: number;
    anchorWorldY: number;
    anchorOffsetX: number;
    anchorOffsetY: number;
    handle: HandleType;
  } | null>(null);

  // Центр оверлея в координатах viewport
  const centerX = canvasOffset.x + overlay.x;
  const centerY = canvasOffset.y + overlay.y;

  // Размеры рамки с учётом масштаба
  const frameWidth = width * overlay.scale;
  const frameHeight = height * overlay.scale;

  // Общая логика для обработки движения (mouse/touch)
  const processMove = useCallback((clientX: number, clientY: number, shiftKey: boolean = false) => {
    if (!startRef.current) return;
    const start = startRef.current;

    if (start.handle === 'rotate') {
      // Вращение относительно текущего центра
      const currentCenterX = canvasOffset.x + overlay.x;
      const currentCenterY = canvasOffset.y + overlay.y;
      
      const dx = clientX - currentCenterX;
      const dy = clientY - currentCenterY;
      let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
      
      if (angle < 0) angle += 360;
      if (angle >= 360) angle -= 360;
      
      if (shiftKey) {
        angle = Math.round(angle / 15) * 15;
      }
      
      onUpdate(overlay.id, { rotation: angle });
    } else {
      // Масштабирование с anchor в противоположном углу
      const { anchorWorldX, anchorWorldY, anchorOffsetX, anchorOffsetY } = start;
      
      // Расстояние от anchor до начальной позиции
      const startDistance = Math.sqrt(
        Math.pow(start.x - anchorWorldX, 2) +
        Math.pow(start.y - anchorWorldY, 2)
      );
      
      // Расстояние от anchor до текущей позиции
      const currentDistance = Math.sqrt(
        Math.pow(clientX - anchorWorldX, 2) +
        Math.pow(clientY - anchorWorldY, 2)
      );
      
      if (startDistance > 10) {
        let newScale = start.scale * (currentDistance / startDistance);
        
        // Умное прилипание масштаба к 1.0 (заполнение одной из сторон) 
        // или к заполнению всего экрана (Cover)
        const snapThreshold = 0.03;
        if (Math.abs(newScale - 1) < snapThreshold) {
          newScale = 1;
        }

        newScale = Math.max(0.1, Math.min(5, newScale));
        
        // Вычисляем новую позицию центра, чтобы anchor остался на месте
        const newAnchorLocalX = anchorOffsetX * width * newScale;
        const newAnchorLocalY = anchorOffsetY * height * newScale;
        
        // Поворачиваем
        const newAnchorRotated = rotatePoint(newAnchorLocalX, newAnchorLocalY, start.rotation);
        
        // Новый центр в координатах viewport
        const newCenterViewportX = anchorWorldX - newAnchorRotated.x;
        const newCenterViewportY = anchorWorldY - newAnchorRotated.y;
        
        // Конвертируем в overlay.x, overlay.y
        const newX = newCenterViewportX - canvasOffset.x;
        const newY = newCenterViewportY - canvasOffset.y;
        
        onUpdate(overlay.id, { scale: newScale, x: newX, y: newY });
      }
    }
  }, [overlay.id, overlay.x, canvasOffset, width, height, onUpdate]);

  // Инициализация drag (общая логика для mouse/touch)
  const initDrag = useCallback((clientX: number, clientY: number, handle: HandleType) => {
    if (handle === 'rotate') {
      startRef.current = {
        x: clientX,
        y: clientY,
        scale: overlay.scale,
        rotation: overlay.rotation,
        overlayX: overlay.x,
        overlayY: overlay.y,
        anchorWorldX: 0,
        anchorWorldY: 0,
        anchorOffsetX: 0,
        anchorOffsetY: 0,
        handle,
      };
    } else {
      const opposite = oppositeCorners[handle];
      const anchorOffset = cornerOffsets[opposite];
      
      const anchorLocalX = anchorOffset.x * width * overlay.scale;
      const anchorLocalY = anchorOffset.y * height * overlay.scale;
      
      const anchorRotated = rotatePoint(anchorLocalX, anchorLocalY, overlay.rotation);
      
      const anchorWorldX = centerX + anchorRotated.x;
      const anchorWorldY = centerY + anchorRotated.y;
      
      startRef.current = {
        x: clientX,
        y: clientY,
        scale: overlay.scale,
        rotation: overlay.rotation,
        overlayX: overlay.x,
        overlayY: overlay.y,
        anchorWorldX,
        anchorWorldY,
        anchorOffsetX: anchorOffset.x,
        anchorOffsetY: anchorOffset.y,
        handle,
      };
    }
  }, [overlay.scale, overlay.rotation, overlay.x, overlay.y, centerX, centerY, width, height]);

  const handleMouseDown = useCallback((e: React.MouseEvent, handle: HandleType) => {
    e.preventDefault();
    e.stopPropagation();

    initDrag(e.clientX, e.clientY, handle);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      processMove(moveEvent.clientX, moveEvent.clientY, moveEvent.shiftKey);
    };

    const handleMouseUp = () => {
      startRef.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [initDrag, processMove]);

  // Touch-события для мобильных устройств
  const handleTouchStart = useCallback((e: React.TouchEvent, handle: HandleType) => {
    e.preventDefault();
    e.stopPropagation();

    const touch = e.touches[0];
    if (!touch) return;

    initDrag(touch.clientX, touch.clientY, handle);

    const handleTouchMove = (moveEvent: TouchEvent) => {
      moveEvent.preventDefault();
      const moveTouch = moveEvent.touches[0];
      if (!moveTouch) return;
      processMove(moveTouch.clientX, moveTouch.clientY, false);
    };

    const handleTouchEnd = () => {
      startRef.current = null;
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchcancel', handleTouchEnd);
  }, [initDrag, processMove]);

  // Позиции угловых узлов
  const corners = {
    tl: { x: -frameWidth / 2, y: -frameHeight / 2 },
    tr: { x: frameWidth / 2, y: -frameHeight / 2 },
    bl: { x: -frameWidth / 2, y: frameHeight / 2 },
    br: { x: frameWidth / 2, y: frameHeight / 2 },
  };

  // Позиция кнопки вращения (сверху)
  const rotateHandlePos = { x: 0, y: -frameHeight / 2 - ROTATE_OFFSET };

  // Позиции кнопок внизу (по центру)
  const bottomY = frameHeight / 2 + BUTTON_SIZE / 2 + 10;
  const totalButtonsWidth = BUTTON_SIZE * 3 + BUTTON_GAP * 2; // Увеличили для 3 кнопок
  const flipHPos = { x: -totalButtonsWidth / 2 + BUTTON_SIZE / 2, y: bottomY };
  const settingsBtnPos = { x: 0, y: bottomY }; // Центральная кнопка
  const flipVPos = { x: totalButtonsWidth / 2 - BUTTON_SIZE / 2, y: bottomY };
  
  // Кнопка удаления — нижний левый угол
  const deletePos = { x: -frameWidth / 2, y: frameHeight / 2 + BUTTON_SIZE / 2 + 10 };
  
  // Кнопка "подогнать под размер" — нижний правый угол
  const fitPos = { x: frameWidth / 2, y: frameHeight / 2 + BUTTON_SIZE / 2 + 10 };

  // Общие стили для кнопок
  const buttonBaseStyle = "w-full h-full rounded-md flex items-center justify-center transition-colors";

  // Определение курсора в зависимости от поворота
  const getCursor = (key: string) => {
    const rotation = overlay.rotation % 180;
    const isSwapped = (rotation > 45 && rotation < 135);
    
    if (key === 'tl' || key === 'br') {
      return isSwapped ? 'nesw-resize' : 'nwse-resize';
    } else {
      return isSwapped ? 'nwse-resize' : 'nesw-resize';
    }
  };

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[100]"
      style={{ overflow: 'visible' }}
    >
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ overflow: 'visible' }}
      >
        <g transform={`translate(${centerX}, ${centerY}) rotate(${overlay.rotation})`}>
          {/* Основная рамка */}
          <rect
            x={-frameWidth / 2}
            y={-frameHeight / 2}
            width={frameWidth}
            height={frameHeight}
            fill="none"
            stroke="rgba(96, 165, 250, 0.9)"
            strokeWidth="1.5"
          />

          {/* Линия к кнопке вращения */}
          <line
            x1={0}
            y1={-frameHeight / 2}
            x2={0}
            y2={-frameHeight / 2 - ROTATE_OFFSET + BUTTON_SIZE / 2 + 2}
            stroke="rgba(96, 165, 250, 0.6)"
            strokeWidth="1"
          />

          {/* Угловые узлы масштабирования */}
          {Object.entries(corners).map(([key, pos]) => (
            <g key={key}>
              {/* Невидимая большая зона касания */}
              <rect
                x={pos.x - HANDLE_SIZE / 2}
                y={pos.y - HANDLE_SIZE / 2}
                width={HANDLE_SIZE}
                height={HANDLE_SIZE}
                fill="transparent"
                className="pointer-events-auto"
                style={{ 
                  cursor: getCursor(key),
                  touchAction: 'none',
                }}
                onMouseDown={(e) => handleMouseDown(e, key as HandleType)}
                onTouchStart={(e) => handleTouchStart(e, key as HandleType)}
              />
              {/* Видимый маленький квадрат */}
              <rect
                x={pos.x - HANDLE_VISUAL_SIZE / 2}
                y={pos.y - HANDLE_VISUAL_SIZE / 2}
                width={HANDLE_VISUAL_SIZE}
                height={HANDLE_VISUAL_SIZE}
                fill="rgba(96, 165, 250, 1)"
                rx="1"
                className="pointer-events-none"
              />
            </g>
          ))}

          {/* Кнопка вращения (сверху) */}
          <foreignObject
            x={rotateHandlePos.x - BUTTON_SIZE / 2}
            y={rotateHandlePos.y - BUTTON_SIZE / 2}
            width={BUTTON_SIZE}
            height={BUTTON_SIZE}
            className="pointer-events-auto"
          >
            <div
              onMouseDown={(e) => handleMouseDown(e as any, 'rotate')}
              onTouchStart={(e) => handleTouchStart(e as any, 'rotate')}
              className={`${buttonBaseStyle} cursor-grab bg-slate-900 border-2 border-blue-400 text-blue-400 hover:bg-blue-950 hover:text-blue-300`}
              style={{ touchAction: 'none' }}
            >
              <RotateCw className="w-4 h-4" />
            </div>
          </foreignObject>

          {/* Кнопка FlipH */}
          <foreignObject
            x={flipHPos.x - BUTTON_SIZE / 2}
            y={flipHPos.y - BUTTON_SIZE / 2}
            width={BUTTON_SIZE}
            height={BUTTON_SIZE}
            className="pointer-events-auto"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpdate(overlay.id, { flipH: !overlay.flipH });
              }}
              className={`${buttonBaseStyle} border-2 ${
                overlay.flipH 
                  ? 'bg-blue-500 border-blue-400 text-white' 
                  : 'bg-slate-900 border-blue-400 text-blue-400 hover:bg-blue-950 hover:text-blue-300'
              }`}
              title={t('editor.flip_h')}
            >
              <FlipHorizontal className="w-4 h-4" />
            </button>
          </foreignObject>

          {/* Кнопка настроек (Blend & Opacity) */}
          <foreignObject
            x={settingsBtnPos.x - BUTTON_SIZE / 2}
            y={settingsBtnPos.y - BUTTON_SIZE / 2}
            width={BUTTON_SIZE}
            height={BUTTON_SIZE}
            className="pointer-events-auto"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowSettings(!showSettings);
              }}
              className={`${buttonBaseStyle} border-2 ${
                showSettings 
                  ? 'bg-blue-500 border-blue-400 text-white' 
                  : 'bg-slate-900 border-blue-400 text-blue-400 hover:bg-blue-950 hover:text-blue-300'
              }`}
              title={t('editor.settings')}
            >
              <Settings2 className="w-4 h-4" />
            </button>
          </foreignObject>

          {/* Кнопка FlipV */}
          <foreignObject
            x={flipVPos.x - BUTTON_SIZE / 2}
            y={flipVPos.y - BUTTON_SIZE / 2}
            width={BUTTON_SIZE}
            height={BUTTON_SIZE}
            className="pointer-events-auto"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpdate(overlay.id, { flipV: !overlay.flipV });
              }}
              className={`${buttonBaseStyle} border-2 ${
                overlay.flipV 
                  ? 'bg-blue-500 border-blue-400 text-white' 
                  : 'bg-slate-900 border-blue-400 text-blue-400 hover:bg-blue-950 hover:text-blue-300'
              }`}
              title={t('editor.flip_v')}
            >
              <FlipVertical className="w-4 h-4" />
            </button>
          </foreignObject>

          {/* Кнопка удаления (Красный крестик) */}
          <foreignObject
            x={deletePos.x - BUTTON_SIZE / 2}
            y={deletePos.y - BUTTON_SIZE / 2}
            width={BUTTON_SIZE}
            height={BUTTON_SIZE}
            className="pointer-events-auto"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(overlay.id);
              }}
              className={`${buttonBaseStyle} bg-slate-900 border-2 border-red-500 text-red-500 hover:bg-red-950 hover:text-red-400`}
              title="Delete"
            >
              <X className="w-4 h-4" />
            </button>
          </foreignObject>

          {/* Кнопка "подогнать под размер" */}
          <foreignObject
            x={fitPos.x - BUTTON_SIZE / 2}
            y={fitPos.y - BUTTON_SIZE / 2}
            width={BUTTON_SIZE}
            height={BUTTON_SIZE}
            className="pointer-events-auto"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                
                // Пропорции
                const isImgVertical = imageDimensions && imageDimensions.height > imageDimensions.width;
                const overlayAspectRatio = width / height;
                const isOverlayVertical = overlayAspectRatio < 1;
                
                // Если ориентации не совпадают - поворачиваем на 90 градусов
                const shouldRotate = (isImgVertical && !isOverlayVertical) || (!isImgVertical && isOverlayVertical);
                const targetRotation = shouldRotate ? 90 : 0;
                
                // Вычисляем масштаб для идеального заполнения (Fit/Cover)
                let targetScale = 1;
                if (shouldRotate) {
                  // Если поворачиваем, то ширина становится высотой и наоборот
                  targetScale = isImgVertical ? (1 / overlayAspectRatio) : overlayAspectRatio;
                }

                onUpdate(overlay.id, { 
                  scale: targetScale, 
                  rotation: targetRotation, 
                  x: 0, 
                  y: 0,
                  flipH: false,
                  flipV: false,
                });
              }}
              className={`${buttonBaseStyle} bg-slate-900 border-2 border-emerald-400 text-emerald-400 hover:bg-emerald-950 hover:text-emerald-300`}
              title="Fit to canvas"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </foreignObject>

          {/* Панель настроек (Blend Mode & Opacity) */}
          {showSettings && (
            <foreignObject
              x={-110} // Центрируем панель (220/2)
              y={-frameHeight / 2 - ROTATE_OFFSET - 85}
              width={220}
              height={95}
              className="pointer-events-auto"
            >
              <div className="bg-slate-900/90 backdrop-blur-md border-2 border-blue-400/50 rounded-xl p-3 shadow-2xl space-y-3">
                {/* Blend Mode */}
                <div className="flex items-center gap-2">
                  <div className="bg-blue-500/20 p-1.5 rounded-lg">
                    <Settings2 className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <Select
                    value={overlay.blendMode}
                    onValueChange={(value: Overlay['blendMode']) => onUpdate(overlay.id, { blendMode: value })}
                  >
                    <SelectTrigger 
                      className="h-8 text-[11px] bg-slate-800/50 border-slate-700 text-white rounded-lg flex-1"
                      onWheel={(e) => {
                        e.preventDefault();
                        const idx = BLEND_MODES.findIndex(m => m.value === overlay.blendMode);
                        if (idx < 0) return;
                        if (e.deltaY > 0) {
                          const next = BLEND_MODES[(idx + 1) % BLEND_MODES.length];
                          onUpdate(overlay.id, { blendMode: next.value });
                        } else if (e.deltaY < 0) {
                          const prev = BLEND_MODES[(idx - 1 + BLEND_MODES.length) % BLEND_MODES.length];
                          onUpdate(overlay.id, { blendMode: prev.value });
                        }
                      }}
                    >
                      <SelectValue placeholder="Blend mode" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700 text-white">
                      {BLEND_MODES.map((mode) => (
                        <SelectItem key={mode.value} value={mode.value} className="text-[11px] focus:bg-blue-500 focus:text-white">
                          {t(`blend_modes.${mode.value}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Opacity */}
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-500/20 p-1.5 rounded-lg">
                    <Droplets className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="flex-1 px-1">
                    <Slider
                      value={[overlay.opacity]}
                      onValueChange={([value]) => onUpdate(overlay.id, { opacity: value })}
                      min={0}
                      max={1}
                      step={0.01}
                      className="cursor-pointer"
                    />
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 w-7 text-right">
                    {Math.round(overlay.opacity * 100)}%
                  </span>
                </div>
              </div>
            </foreignObject>
          )}
        </g>
      </svg>
    </div>
  );
};

export default OverlayTransformFrame;
