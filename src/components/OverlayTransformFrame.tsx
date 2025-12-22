import React, { useCallback, useRef } from 'react';
import { Overlay } from '@/lib/types';
import { FlipHorizontal, FlipVertical, Trash2, RotateCw, Maximize2 } from 'lucide-react';

interface OverlayTransformFrameProps {
  overlay: Overlay;
  width: number;
  height: number;
  canvasOffset: { x: number; y: number };
  onUpdate: (id: string, newProps: Partial<Overlay>) => void;
  onDelete: (id: string) => void;
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
  onUpdate,
  onDelete,
}) => {
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
  const totalButtonsWidth = BUTTON_SIZE * 2 + BUTTON_GAP;
  const flipHPos = { x: -totalButtonsWidth / 2 + BUTTON_SIZE / 2, y: bottomY };
  const flipVPos = { x: totalButtonsWidth / 2 - BUTTON_SIZE / 2, y: bottomY };
  
  // Кнопка удаления — нижний левый угол
  const deletePos = { x: -frameWidth / 2, y: frameHeight / 2 + BUTTON_SIZE / 2 + 10 };
  
  // Кнопка "подогнать под размер" — нижний правый угол
  const fitPos = { x: frameWidth / 2, y: frameHeight / 2 + BUTTON_SIZE / 2 + 10 };

  // Общие стили для кнопок
  const buttonBaseStyle = "w-full h-full rounded-md flex items-center justify-center transition-colors";

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
                  cursor: key === 'tl' || key === 'br' ? 'nwse-resize' : 'nesw-resize',
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
            >
              <FlipHorizontal className="w-4 h-4" />
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
            >
              <FlipVertical className="w-4 h-4" />
            </button>
          </foreignObject>

          {/* Кнопка удаления */}
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
              className={`${buttonBaseStyle} bg-slate-900 border-2 border-red-400 text-red-400 hover:bg-red-950 hover:text-red-300`}
            >
              <Trash2 className="w-4 h-4" />
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
                // Сбрасываем scale, rotation, позицию - центрируем и подгоняем под размер
                onUpdate(overlay.id, { 
                  scale: 1, 
                  rotation: 0, 
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
        </g>
      </svg>
    </div>
  );
};

export default OverlayTransformFrame;
