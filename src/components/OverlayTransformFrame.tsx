import React, { useCallback, useRef } from 'react';
import { Overlay } from '@/lib/types';
import { useTranslation } from 'react-i18next';

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
const ROTATE_ZONE_FACTOR = 0.45; // Увеличили зону вращения (45%)

// Современный курсор вращения в стиле Phosphor Icons
const ROTATE_CURSOR = `url("data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M24 16c0 4.418-3.582 8-8 8s-8-3.582-8-8 3.582-8 8-8c1.657 0 3.182.504 4.444 1.364' stroke='black' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M24 16c0 4.418-3.582 8-8 8s-8-3.582-8-8 3.582-8 8-8c1.657 0 3.182.504 4.444 1.364' stroke='white' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M18 12.5l4.5-1.5L24 6.5' stroke='black' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M18 12.5l4.5-1.5L24 6.5' stroke='white' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") 16 16, alias`;

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
}) => {
  const { t } = useTranslation();
  const startRef = useRef<{ 
    x: number; 
    y: number; 
    scale: number; 
    rotation: number;
    initialAngle: number; // Добавляем начальный угол мыши
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
      const currentAngle = Math.atan2(dy, dx) * (180 / Math.PI);
      
      // Вычисляем разницу углов
      let angleDiff = currentAngle - start.initialAngle;
      
      // Нормализация разницы
      if (angleDiff < -180) angleDiff += 360;
      if (angleDiff > 180) angleDiff -= 360;
      
      let newRotation = start.rotation + angleDiff;
      
      // Нормализация результата
      if (newRotation < 0) newRotation += 360;
      if (newRotation >= 360) newRotation -= 360;
      
      if (shiftKey) {
        newRotation = Math.round(newRotation / 15) * 15;
      }
      
      onUpdate(overlay.id, { rotation: newRotation });
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
      const currentCenterX = centerX;
      const currentCenterY = centerY;
      const dx = clientX - currentCenterX;
      const dy = clientY - currentCenterY;
      const initialAngle = Math.atan2(dy, dx) * (180 / Math.PI);

      startRef.current = {
        x: clientX,
        y: clientY,
        scale: overlay.scale,
        rotation: overlay.rotation,
        initialAngle, // Сохраняем начальный угол
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

  // Определение курсора в зависимости от поворота
const getResizeCursor = (key: string) => {
  const rotation = overlay.rotation % 180;
  const isSwapped = (rotation > 45 && rotation < 135);
  
  if (key === 'tl' || key === 'br') {
    return isSwapped ? 'nesw-resize' : 'nwse-resize';
  } else {
    return isSwapped ? 'nwse-resize' : 'nesw-resize';
  }
};

// Современный курсор вращения в стиле Phosphor Icons
const ROTATE_CURSOR = `url("data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M24 16c0 4.418-3.582 8-8 8s-8-3.582-8-8 3.582-8 8-8c1.657 0 3.182.504 4.444 1.364' stroke='black' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M24 16c0 4.418-3.582 8-8 8s-8-3.582-8-8 3.582-8 8-8c1.657 0 3.182.504 4.444 1.364' stroke='white' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M18 12.5l4.5-1.5L24 6.5' stroke='black' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M18 12.5l4.5-1.5L24 6.5' stroke='white' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") 16 16, alias`;

// Размер зоны вращения (45% от размера + фиксированный минимум)
const rotationZoneSize = Math.max(40, Math.min(frameWidth, frameHeight) * ROTATE_ZONE_FACTOR);

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

          {/* Угловые узлы масштабирования и вращения */}
          {Object.entries(corners).map(([key, pos]) => (
            <g key={key}>
              {/* Зона вращения - большая, лежит под узлом resize */}
              <rect
                x={pos.x - rotationZoneSize / 2}
                y={pos.y - rotationZoneSize / 2}
                width={rotationZoneSize}
                height={rotationZoneSize}
                fill="transparent"
                className="pointer-events-auto"
                style={{ 
                  cursor: ROTATE_CURSOR, // Курсор вращения - круглая стрелка
                  touchAction: 'none',
                }}
                onMouseDown={(e) => handleMouseDown(e, 'rotate')}
                onTouchStart={(e) => handleTouchStart(e, 'rotate')}
              />

              {/* Зона масштабирования - точечная на углу */}
              {/* Невидимая большая зона касания */}
              <rect
                x={pos.x - HANDLE_SIZE / 2}
                y={pos.y - HANDLE_SIZE / 2}
                width={HANDLE_SIZE}
                height={HANDLE_SIZE}
                fill="transparent"
                className="pointer-events-auto"
                style={{ 
                  cursor: getResizeCursor(key),
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
        </g>
      </svg>
    </div>
  );
};

export default OverlayTransformFrame;
